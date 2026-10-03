import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays, addMonths, addWeeks, addYears, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemStatus, ItemType, Priority, Recurrence } from '@lifedesk/types';

const MAX_REMINDER_DAYS = 365; // guard against absurd values

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  private calculateReminders(dueDate: Date, reminderDays: number[]) {
    const now = Date.now();
    return reminderDays
      .filter((days) => Number.isInteger(days) && days >= 0 && days <= MAX_REMINDER_DAYS)
      .map((days) => ({
        remindAt: addDays(dueDate, -days),
        isTriggered: false,
      }))
      .filter((r) => r.remindAt.getTime() > now);
  }

  /**
   * Calculate the next due date for a recurring item using date-fns helpers
   * so month-end edge cases (Jan 31 → Feb 28, not Mar 3) are handled correctly.
   */
  private calculateNextDueDate(currentDue: Date, recurrence: Recurrence): Date {
    switch (recurrence) {
      case Recurrence.DAILY:
        return addDays(currentDue, 1);
      case Recurrence.WEEKLY:
        return addWeeks(currentDue, 1);
      case Recurrence.MONTHLY:
        return addMonths(currentDue, 1);   // date-fns clamps end-of-month correctly
      case Recurrence.YEARLY:
        return addYears(currentDue, 1);
      default:
        return currentDue;
    }
  }

  /**
   * Enrich an item with computed fields (isOverdue, isDueToday, daysRemaining)
   * using the user's stored timezone so the day boundary is correct for them.
   */
  private enrichItem(item: any, userTimezone = 'UTC') {
    const nowUtc = new Date();
    // Convert "now" to the user's timezone to get their local midnight boundaries
    const nowLocal = toZonedTime(nowUtc, userTimezone);
    const todayStart = startOfDay(nowLocal);
    const todayEnd = endOfDay(nowLocal);

    const itemDue = new Date(item.dueDate);
    // Also view the item due date through the user's timezone lens
    const itemDueLocal = toZonedTime(itemDue, userTimezone);

    const isPending = item.status === ItemStatus.PENDING;
    const isOverdue = isPending && itemDueLocal < todayStart;
    const isDueToday = isPending && itemDueLocal >= todayStart && itemDueLocal <= todayEnd;
    const daysRemaining = Math.ceil(
      (itemDueLocal.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      ...item,
      amount: item.amount ? Number(item.amount) : null,
      isOverdue,
      isDueToday,
      daysRemaining,
    };
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateItemDto) {
    const dueDate = new Date(dto.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date');
    }

    const reminderDays =
      dto.reminderDaysBefore && dto.reminderDaysBefore.length > 0
        ? dto.reminderDaysBefore
        : [1, 3];

    const remindersData = this.calculateReminders(dueDate, reminderDays);

    // Fetch user timezone for enrichment
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = userRecord?.timezone ?? 'UTC';

    // Wrap item + activity creation in a transaction so a partial failure leaves
    // no orphaned records.
    const item = await this.prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          userId,
          title: dto.title,
          description: dto.description,
          type: dto.type as any,
          priority: (dto.priority || Priority.MEDIUM) as any,
          categoryId: dto.categoryId || null,
          dueDate,
          hasSpecificTime: dto.hasSpecificTime ?? false,
          amount: dto.amount ? dto.amount : null,
          currency: 'USD',
          documentNumber: dto.documentNumber,
          issuingAuthority: dto.issuingAuthority,
          recurrence: (dto.recurrence || Recurrence.NONE) as any,
          reminderDaysBefore: reminderDays,
          reminders: {
            create: remindersData,
          },
        },
        include: {
          category: true,
          reminders: true,
          attachments: true,
        },
      });

      await tx.activity.create({
        data: {
          userId,
          itemId: created.id,
          action: 'ITEM_CREATED',
          details: { title: created.title, type: created.type, dueDate: created.dueDate },
        },
      });

      return created;
    });

    return this.enrichItem(item, userTimezone);
  }

  async findAll(
    userId: string,
    filters?: {
      status?: ItemStatus;
      type?: ItemType;
      priority?: Priority;
      categoryId?: string;
      timeframe?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all';
      search?: string;
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = Math.max(1, filters?.page ?? 1);
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
    const skip = (page - 1) * limit;

    const nowUtc = new Date();

    // We use UTC boundaries for DB queries (stored in UTC) but keep user's
    // timezone in mind for the enrichment step.
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = userRecord?.timezone ?? 'UTC';
    const nowLocal = toZonedTime(nowUtc, userTimezone);
    const todayStart = startOfDay(nowLocal);
    const todayEnd = endOfDay(nowLocal);

    const where: any = { userId };

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // timeframe takes full precedence and sets its own status; explicit status
    // only applies when timeframe is absent or 'all'.
    if (filters?.timeframe && filters.timeframe !== 'all') {
      switch (filters.timeframe) {
        case 'overdue':
          where.status = ItemStatus.PENDING;
          where.dueDate = { lt: todayStart };
          break;
        case 'today':
          where.status = ItemStatus.PENDING;
          where.dueDate = { gte: todayStart, lte: todayEnd };
          break;
        case 'upcoming':
          where.status = ItemStatus.PENDING;
          where.dueDate = { gt: todayEnd };
          break;
        case 'completed':
          where.status = ItemStatus.COMPLETED;
          break;
      }
    } else {
      // No timeframe — apply explicit status/type/priority/category filters
      if (filters?.status) where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.dueDate = {
        ...(where.dueDate || {}),
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    if (filters?.type) where.type = filters.type;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.categoryId) where.categoryId = filters.categoryId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.item.findMany({
        where,
        include: {
          category: true,
          reminders: true,
          attachments: true,
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.item.count({ where }),
    ]);

    return {
      data: items.map((item) => this.enrichItem(item, userTimezone)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = userRecord?.timezone ?? 'UTC';

    const item = await this.prisma.item.findFirst({
      where: { id, userId },
      include: {
        category: true,
        reminders: true,
        attachments: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return this.enrichItem(item, userTimezone);
  }

  async update(userId: string, id: string, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = userRecord?.timezone ?? 'UTC';

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : existing.dueDate;
    const reminderDays = dto.reminderDaysBefore || existing.reminderDaysBefore;

    const shouldUpdateReminders =
      dto.dueDate !== undefined || dto.reminderDaysBefore !== undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (shouldUpdateReminders) {
        await tx.reminder.deleteMany({ where: { itemId: id } });
        const newReminders = this.calculateReminders(dueDate, reminderDays);
        if (newReminders.length > 0) {
          await tx.reminder.createMany({
            data: newReminders.map((r) => ({ itemId: id, ...r })),
          });
        }
      }

      const result = await tx.item.update({
        where: { id },
        data: {
          title: dto.title ?? existing.title,
          description: dto.description !== undefined ? dto.description : existing.description,
          type: dto.type ? (dto.type as any) : existing.type,
          status: dto.status ? (dto.status as any) : existing.status,
          priority: dto.priority ? (dto.priority as any) : existing.priority,
          categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
          dueDate,
          hasSpecificTime: dto.hasSpecificTime ?? existing.hasSpecificTime,
          amount: dto.amount !== undefined ? dto.amount : existing.amount,
          documentNumber:
            dto.documentNumber !== undefined ? dto.documentNumber : existing.documentNumber,
          issuingAuthority:
            dto.issuingAuthority !== undefined ? dto.issuingAuthority : existing.issuingAuthority,
          recurrence: dto.recurrence ? (dto.recurrence as any) : existing.recurrence,
          reminderDaysBefore: reminderDays,
        },
        include: {
          category: true,
          reminders: true,
          attachments: true,
        },
      });

      await tx.activity.create({
        data: {
          userId,
          itemId: id,
          action: 'ITEM_UPDATED',
          details: { title: result.title, changes: JSON.parse(JSON.stringify(dto)) },
        },
      });

      return result;
    });

    return this.enrichItem(updated, userTimezone);
  }

  async complete(userId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = userRecord?.timezone ?? 'UTC';

    const { completed, nextItem } = await this.prisma.$transaction(async (tx) => {
      const completed = await tx.item.update({
        where: { id },
        data: {
          status: ItemStatus.COMPLETED as any,
          completedAt: new Date(),
        },
        include: {
          category: true,
          reminders: true,
          attachments: true,
        },
      });

      await tx.activity.create({
        data: {
          userId,
          itemId: id,
          action: 'ITEM_COMPLETED',
          details: { title: item.title, completedAt: new Date() },
        },
      });

      // If item is recurring, automatically spawn the next cycle
      let nextItem: any = null;
      if (item.recurrence && item.recurrence !== Recurrence.NONE) {
        const nextDue = this.calculateNextDueDate(new Date(item.dueDate), item.recurrence as any);
        const reminders = this.calculateReminders(nextDue, item.reminderDaysBefore);

        nextItem = await tx.item.create({
          data: {
            userId,
            title: item.title,
            description: item.description,
            type: item.type,
            priority: item.priority,
            categoryId: item.categoryId,
            dueDate: nextDue,
            hasSpecificTime: item.hasSpecificTime,
            amount: item.amount,
            currency: item.currency,
            documentNumber: item.documentNumber,
            issuingAuthority: item.issuingAuthority,
            recurrence: item.recurrence,
            reminderDaysBefore: item.reminderDaysBefore,
            status: ItemStatus.PENDING as any,
            reminders: {
              create: reminders,
            },
          },
          include: {
            category: true,
            reminders: true,
            attachments: true,
          },
        });

        await tx.activity.create({
          data: {
            userId,
            itemId: nextItem.id,
            action: 'ITEM_RECURRENCE_SPAWNED',
            details: {
              title: nextItem.title,
              recurrence: nextItem.recurrence,
              dueDate: nextItem.dueDate,
            },
          },
        });

        await tx.inAppNotification.create({
          data: {
            userId,
            title: 'Recurring Item Scheduled 🔄',
            message: `"${item.title}" completed! Next cycle scheduled for ${nextDue.toLocaleDateString()}.`,
            type: 'UPCOMING_REMINDER',
            itemId: nextItem.id,
          },
        });
      }

      return { completed, nextItem };
    });

    return {
      completedItem: this.enrichItem(completed, userTimezone),
      nextRecurringItem: nextItem ? this.enrichItem(nextItem, userTimezone) : null,
    };
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.item.delete({ where: { id } });
      await tx.activity.create({
        data: {
          userId,
          action: 'ITEM_DELETED',
          details: { title: item.title, type: item.type },
        },
      });
    });

    return { success: true, id };
  }

  /**
   * Automated Recurrence Scheduler (LifeDesk V2)
   * Runs every day at midnight and checks for active recurring items that have reached
   * or passed their due date without being manually completed. Automatically spawns
   * the next cycle so the user never misses an upcoming cycle in their agenda.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringSchedules() {
    const now = new Date();
    try {
      const pendingRecurringItems = await this.prisma.item.findMany({
        where: {
          recurrence: { not: Recurrence.NONE },
          dueDate: { lte: now },
          status: ItemStatus.PENDING,
        },
      });

      for (const item of pendingRecurringItems) {
        try {
          const nextDue = this.calculateNextDueDate(new Date(item.dueDate), item.recurrence as any);

          // Prevent duplicate future occurrences for the exact same due date
          const existingNext = await this.prisma.item.findFirst({
            where: {
              userId: item.userId,
              title: item.title,
              recurrence: item.recurrence,
              dueDate: nextDue,
            },
          });

          if (!existingNext) {
            const reminders = this.calculateReminders(nextDue, item.reminderDaysBefore);
            await this.prisma.$transaction(async (tx) => {
              const spawned = await tx.item.create({
                data: {
                  userId: item.userId,
                  title: item.title,
                  description: item.description,
                  type: item.type,
                  priority: item.priority,
                  categoryId: item.categoryId,
                  dueDate: nextDue,
                  hasSpecificTime: item.hasSpecificTime,
                  amount: item.amount,
                  currency: item.currency,
                  documentNumber: item.documentNumber,
                  issuingAuthority: item.issuingAuthority,
                  recurrence: item.recurrence,
                  reminderDaysBefore: item.reminderDaysBefore,
                  status: ItemStatus.PENDING as any,
                  reminders: {
                    create: reminders,
                  },
                },
              });

              await tx.activity.create({
                data: {
                  userId: item.userId,
                  itemId: spawned.id,
                  action: 'ITEM_RECURRENCE_SCHEDULED',
                  details: {
                    title: spawned.title,
                    recurrence: spawned.recurrence,
                    dueDate: spawned.dueDate,
                  },
                },
              });

              await tx.inAppNotification.create({
                data: {
                  userId: item.userId,
                  title: 'Recurring Cycle Scheduled 🔄',
                  message: `New cycle for "${item.title}" automatically prepared for ${nextDue.toLocaleDateString()}.`,
                  type: 'UPCOMING_REMINDER',
                  itemId: spawned.id,
                },
              });
            });
          }
        } catch (itemErr) {
          console.error(`[ItemsService] Failed to schedule next cycle for item ${item.id}:`, itemErr);
        }
      }
    } catch (err) {
      console.error('[ItemsService] Recurrence scheduler job error:', err);
    }
  }
}
