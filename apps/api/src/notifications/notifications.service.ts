import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    // Automatically trigger any due reminders before returning notifications
    await this.triggerDueReminders(userId);

    return this.prisma.inAppNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(userId: string, id: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  private async triggerDueReminders(userId: string) {
    const now = new Date();

    const dueReminders = await this.prisma.reminder.findMany({
      where: {
        isTriggered: false,
        remindAt: { lte: now },
        item: {
          userId,
          status: 'PENDING',
        },
      },
      include: {
        item: true,
      },
    });

    for (const reminder of dueReminders) {
      const daysLeft = Math.ceil(
        (new Date(reminder.item.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const timeMsg = daysLeft <= 0 ? 'due today!' : `due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`;

      await this.prisma.$transaction([
        this.prisma.reminder.update({
          where: { id: reminder.id },
          data: { isTriggered: true },
        }),
        this.prisma.inAppNotification.create({
          data: {
            userId,
            title: `Reminder: ${reminder.item.title}`,
            message: `Your ${reminder.item.type.toLowerCase()} "${reminder.item.title}" is ${timeMsg}`,
            type: daysLeft <= 0 ? 'DUE_TODAY' : 'UPCOMING_REMINDER',
            itemId: reminder.itemId,
          },
        }),
      ]);
    }
  }
}
