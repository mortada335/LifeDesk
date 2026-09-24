import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        OR: [{ userId }, { userId: null }],
      },
      include: {
        _count: {
          select: { items: { where: { userId } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      userId: c.userId,
      itemCount: c._count.items,
    }));
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: {
        name: { equals: dto.name, mode: 'insensitive' },
        OR: [{ userId }, { userId: null }],
      },
    });

    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    return this.prisma.category.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color || '#6366f1',
        icon: dto.icon || 'folder',
      },
    });
  }

  async delete(userId: string, categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found or cannot be deleted');
    }

    return this.prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
