import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemStatus, ItemType, Priority, Recurrence } from '@lifedesk/types';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  private calculateReminders(dueDate: Date, reminderDays: number[]) {
    return reminderDays
      .map((days) => {
        const remindAt = new Date(dueDate.getTime() - days * 24 * 60 * 60 * 1000);
        return { remindAt, isTriggered: false };
      })
      .filter((r) => r.remindAt.getTime() > Date.now());
  }

  private calculateNextDueDate(currentDue: Date, recurrence: Recurrence): Date {
    const next = new Date(currentDue);
    switch (recurrence) {
      case Recurrence.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case Recurrence.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case Recurrence.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case Recurrence.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
      default:
        break;
    }
    return next;
  }

  private enrichItem(item: any) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const itemDue = new Date(item.dueDate);
    const isPending = item.status === ItemStatus.PENDING;

    const isOverdue = isPending && itemDue.getTime() < startOfToday.getTime();
    const isDueToday = isPending && itemDue.getTime() >= startOfToday.getTime() && itemDue.getTime() <= endOfToday.getTime();
    const daysRemaining = Math.ceil((itemDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ...item,
      amount: item.amount ? Number(item.amount) : null,
      isOverdue,
      isDueToday,
      daysRemaining,
    };
  }

  async create(userId: string, dto: CreateItemDto) {
    const dueDate = new Date(dto.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date');
    }

    const reminderDays = dto.reminderDaysBefore && dto.reminderDaysBefore.length > 0
      ? dto.reminderDaysBefore
      : [1, 3];

    const remindersData = this.calculateReminders(dueDate, reminderDays);

    const item = await this.prisma.item.create({
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

    await this.prisma.activity.create({
      data: {
        userId,
        itemId: item.id,
        action: 'ITEM_CREATED',
        details: { title: item.title, type: item.type, dueDate: item.dueDate },
      },
    });

    return this.enrichItem(item);
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
    },
  ) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const where: any = { userId };

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { documentNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.timeframe) {
      if (filters.timeframe === 'overdue') {
        where.status = ItemStatus.PENDING;
        where.dueDate = { lt: startOfToday };
      } else if (filters.timeframe === 'today') {
        where.status = ItemStatus.PENDING;
        where.dueDate = { gte: startOfToday, lte: endOfToday };
      } else if (filters.timeframe === 'upcoming') {
        where.status = ItemStatus.PENDING;
        where.dueDate = { gt: endOfToday };
      } else if (filters.timeframe === 'completed') {
        where.status = ItemStatus.COMPLETED;
      }
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        category: true,
        reminders: true,
        attachments: true,
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    });

    return items.map((item) => this.enrichItem(item));
  }

  async findOne(userId: string, id: string) {
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

    return this.enrichItem(item);
  }

  async update(userId: string, id: string, dto: UpdateItemDto) {
    const existing = await this.prisma.item.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Item not found');
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : existing.dueDate;
    const reminderDays = dto.reminderDaysBefore || existing.reminderDaysBefore;

    // Recalculate reminders if dueDate or reminderDays changed
    const shouldUpdateReminders = dto.dueDate !== undefined || dto.reminderDaysBefore !== undefined;

    if (shouldUpdateReminders) {
      await this.prisma.reminder.deleteMany({ where: { itemId: id } });
      const newReminders = this.calculateReminders(dueDate, reminderDays);
      if (newReminders.length > 0) {
        await this.prisma.reminder.createMany({
          data: newReminders.map((r) => ({ itemId: id, ...r })),
        });
      }
    }

    const updated = await this.prisma.item.update({
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
        documentNumber: dto.documentNumber !== undefined ? dto.documentNumber : existing.documentNumber,
        issuingAuthority: dto.issuingAuthority !== undefined ? dto.issuingAuthority : existing.issuingAuthority,
        recurrence: dto.recurrence ? (dto.recurrence as any) : existing.recurrence,
        reminderDaysBefore: reminderDays,
      },
      include: {
        category: true,
        reminders: true,
        attachments: true,
      },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        itemId: id,
        action: 'ITEM_UPDATED',
        details: { title: updated.title, changes: JSON.parse(JSON.stringify(dto)) },
      },
    });

    return this.enrichItem(updated);
  }

  async complete(userId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const completed = await this.prisma.item.update({
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

    await this.prisma.activity.create({
      data: {
        userId,
        itemId: id,
        action: 'ITEM_COMPLETED',
        details: { title: item.title, completedAt: new Date() },
      },
    });

    // If item is recurring, automatically spawn next cycle instance!
    let nextItem: any = null;
    if (item.recurrence && item.recurrence !== Recurrence.NONE) {
      const nextDue = this.calculateNextDueDate(new Date(item.dueDate), item.recurrence as any);
      const reminders = this.calculateReminders(nextDue, item.reminderDaysBefore);

      nextItem = await this.prisma.item.create({
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

      await this.prisma.activity.create({
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

      await this.prisma.inAppNotification.create({
        data: {
          userId,
          title: 'Recurring Item Scheduled 🔄',
          message: `"${item.title}" completed! Next cycle scheduled for ${nextDue.toLocaleDateString()}.`,
          type: 'UPCOMING_REMINDER',
          itemId: nextItem.id,
        },
      });
    }

    return {
      completedItem: this.enrichItem(completed),
      nextRecurringItem: nextItem ? this.enrichItem(nextItem) : null,
    };
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.item.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    await this.prisma.item.delete({
      where: { id },
    });

    await this.prisma.activity.create({
      data: {
        userId,
        action: 'ITEM_DELETED',
        details: { title: item.title, type: item.type },
      },
    });

    return { success: true, id };
  }
}
