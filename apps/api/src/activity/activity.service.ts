import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    const activities = await this.prisma.activity.findMany({
      where: { userId },
      include: {
        item: {
          select: { title: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return activities.map((act) => ({
      id: act.id,
      action: act.action,
      details: act.details,
      createdAt: act.createdAt.toISOString(),
      itemTitle: act.item?.title || (act.details as any)?.title,
    }));
  }
}
