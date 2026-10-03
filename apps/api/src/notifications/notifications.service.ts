import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    // Pure read — reminder triggering is handled by the cron job, NOT here
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

  /**
   * Runs every 15 minutes system-wide and converts all due (but untriggered)
   * reminders into in-app notifications.
   *
   * Moved from a per-request side-effect on GET /notifications to a proper
   * scheduled job so it:
   *   - Doesn't mutate state on read requests
   *   - Runs for ALL users (not just those who happen to open the app)
   *   - Cannot produce duplicate notifications on rapid polling
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async triggerDueReminders() {
    const now = new Date();

    const dueReminders = await this.prisma.reminder.findMany({
      where: {
        isTriggered: false,
        remindAt: { lte: now },
        item: { status: 'PENDING' },
      },
      include: { item: true },
    });

    if (dueReminders.length === 0) return;

    // Process each reminder in its own transaction so a single failure
    // doesn't roll back all the others.
    for (const reminder of dueReminders) {
      const daysLeft = Math.ceil(
        (new Date(reminder.item.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      const timeMsg =
        daysLeft <= 0 ? 'due today!' : `due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`;

      try {
        await this.prisma.$transaction([
          this.prisma.reminder.update({
            where: { id: reminder.id },
            data: { isTriggered: true },
          }),
          this.prisma.inAppNotification.create({
            data: {
              userId: reminder.item.userId,
              title: `Reminder: ${reminder.item.title}`,
              message: `Your ${reminder.item.type.toLowerCase()} "${reminder.item.title}" is ${timeMsg}`,
              type: daysLeft <= 0 ? 'DUE_TODAY' : 'UPCOMING_REMINDER',
              itemId: reminder.itemId,
            },
          }),
        ]);
      } catch {
        // Log and continue — don't let one failure block the rest
        console.error(`[NotificationsService] Failed to trigger reminder ${reminder.id}`);
      }
    }
  }
}
