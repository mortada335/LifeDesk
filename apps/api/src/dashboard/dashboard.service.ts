import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ItemStatus, ItemType } from '@lifedesk/types';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Run parallel counts for speed
    const [
      overdueCount,
      todayCount,
      upcomingCount,
      completedCount,
      activeRemindersCount,
      monthlyItems,
      allUserItems,
    ] = await Promise.all([
      this.prisma.item.count({
        where: {
          userId,
          status: ItemStatus.PENDING,
          dueDate: { lt: startOfToday },
        },
      }),
      this.prisma.item.count({
        where: {
          userId,
          status: ItemStatus.PENDING,
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      this.prisma.item.count({
        where: {
          userId,
          status: ItemStatus.PENDING,
          dueDate: { gt: endOfToday },
        },
      }),
      this.prisma.item.count({
        where: {
          userId,
          status: ItemStatus.COMPLETED,
        },
      }),
      this.prisma.reminder.count({
        where: {
          isTriggered: false,
          item: {
            userId,
            status: ItemStatus.PENDING,
          },
        },
      }),
      this.prisma.item.findMany({
        where: {
          userId,
          type: { in: [ItemType.BILL, ItemType.SUBSCRIPTION] },
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        select: { amount: true },
      }),
      this.prisma.item.findMany({
        where: { userId },
        include: { category: true },
      }),
    ]);

    const monthlyExpenditure = monthlyItems.reduce(
      (sum, item) => sum + (item.amount ? Number(item.amount) : 0),
      0,
    );

    // Group items by category for breakdown
    const categoryMap = new Map<string, { categoryName: string; count: number; color: string }>();

    for (const item of allUserItems) {
      const catName = item.category?.name || 'Uncategorized';
      const catColor = item.category?.color || '#94a3b8';

      const existing = categoryMap.get(catName);
      if (existing) {
        existing.count += 1;
      } else {
        categoryMap.set(catName, {
          categoryName: catName,
          count: 1,
          color: catColor,
        });
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

    return {
      overdueCount,
      todayCount,
      upcomingCount,
      completedCount,
      activeRemindersCount,
      monthlyExpenditure: Number(monthlyExpenditure.toFixed(2)),
      categoryBreakdown,
    };
  }
}
