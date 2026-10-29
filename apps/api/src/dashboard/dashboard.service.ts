import { Injectable } from '@nestjs/common';
import { startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { PrismaService } from '../prisma/prisma.service';
import { ItemStatus, ItemType } from '@lifedesk/types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    // Respect the user's stored timezone for "today" boundaries
    const userRecord = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const userTimezone = userRecord?.timezone ?? 'UTC';

    const nowUtc = new Date();
    const nowLocal = toZonedTime(nowUtc, userTimezone);
    const todayStart = startOfDay(nowLocal);
    const todayEnd = endOfDay(nowLocal);

    const startOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1);
    const endOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth() + 1, 0, 23, 59, 59, 999);

    // Run all counts in parallel for speed
    const [
      overdueCount,
      todayCount,
      upcomingCount,
      completedCount,
      activeRemindersCount,
      monthlyAmount,
      categoryBreakdownRaw,
    ] = await Promise.all([
      this.prisma.item.count({
        where: { userId, status: ItemStatus.PENDING, dueDate: { lt: todayStart } },
      }),
      this.prisma.item.count({
        where: { userId, status: ItemStatus.PENDING, dueDate: { gte: todayStart, lte: todayEnd } },
      }),
      this.prisma.item.count({
        where: { userId, status: ItemStatus.PENDING, dueDate: { gt: todayEnd } },
      }),
      this.prisma.item.count({
        where: { userId, status: ItemStatus.COMPLETED },
      }),
      this.prisma.reminder.count({
        where: { isTriggered: false, item: { userId, status: ItemStatus.PENDING } },
      }),
      // Sum amounts directly in the DB — no longer fetches every row into memory
      this.prisma.item.aggregate({
        where: {
          userId,
          type: { in: [ItemType.BILL, ItemType.SUBSCRIPTION] },
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      // Group by category in the DB — no longer iterates JS objects for all items
      this.prisma.item.groupBy({
        by: ['categoryId'],
        where: { userId },
        _count: { id: true },
      }),
    ]);

    const monthlyExpenditure = Number(monthlyAmount._sum.amount ?? 0);

    // Resolve category names + colors with a single look-up query
    const categoryIds = categoryBreakdownRaw
      .map((r) => r.categoryId)
      .filter((id): id is string => id !== null);

    const categories = categoryIds.length
      ? await this.prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, color: true },
        })
      : [];

    const catMap = new Map(categories.map((c) => [c.id, c]));

    const categoryBreakdown = categoryBreakdownRaw
      .map((row) => {
        const cat = row.categoryId ? catMap.get(row.categoryId) : undefined;
        return {
          categoryName: cat?.name ?? 'Uncategorized',
          color: cat?.color ?? '#94a3b8',
          count: row._count.id,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      overdueCount,
      todayCount,
      upcomingCount,
      completedCount,
      totalActiveCount: overdueCount + todayCount + upcomingCount,
      activeRemindersCount,
      monthlyExpenditure: Number(monthlyExpenditure.toFixed(2)),
      categoryBreakdown,
    };
  }
}
