jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => {},
  CronExpression: {
    EVERY_DAY_AT_MIDNIGHT: '0 0 * * *',
    EVERY_10_MINUTES: '*/10 * * * *',
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../prisma/prisma.service';
import { ItemType, Recurrence, Priority, ItemStatus } from '@lifedesk/types';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
    },
    item: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
    inAppNotification: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (arg) => {
      if (typeof arg === 'function') {
        return arg(mockPrismaService);
      }
      return Promise.all(arg);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ItemsService>(ItemsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an item with computed reminders and activity log', async () => {
      const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const mockCreated = {
        id: 'item-1',
        userId: 'user-1',
        title: 'Car Insurance',
        type: ItemType.BILL,
        status: ItemStatus.PENDING,
        priority: Priority.HIGH,
        dueDate: new Date(dueDate),
        amount: '120.00',
        recurrence: Recurrence.NONE,
        reminderDaysBefore: [1, 3],
        category: null,
        reminders: [],
        attachments: [],
      };

      mockPrismaService.item.create.mockResolvedValue(mockCreated);
      mockPrismaService.activity.create.mockResolvedValue({});

      const result = await service.create('user-1', {
        title: 'Car Insurance',
        type: ItemType.BILL,
        priority: Priority.HIGH,
        dueDate,
        amount: 120,
        reminderDaysBefore: [1, 3],
      });

      expect(mockPrismaService.item.create).toHaveBeenCalled();
      expect(mockPrismaService.activity.create).toHaveBeenCalled();
      expect(result.id).toBe('item-1');
      expect(result.amount).toBe(120);
    });
  });

  describe('findAll', () => {
    it('should paginate results and return pagination metadata', async () => {
      mockPrismaService.item.findMany.mockResolvedValue([
        {
          id: 'item-1',
          title: 'Rent',
          dueDate: new Date(),
          status: ItemStatus.PENDING,
          amount: '1500.00',
        },
      ]);
      mockPrismaService.item.count.mockResolvedValue(25);

      const result = await service.findAll('user-1', { page: 2, limit: 10 });

      expect(mockPrismaService.item.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('complete', () => {
    it('should complete an item and spawn next recurring cycle when recurring', async () => {
      const originalItem = {
        id: 'item-1',
        userId: 'user-1',
        title: 'Netflix Subscription',
        type: ItemType.SUBSCRIPTION,
        status: ItemStatus.PENDING,
        priority: Priority.MEDIUM,
        dueDate: new Date('2026-01-31T00:00:00Z'),
        amount: '15.99',
        recurrence: Recurrence.MONTHLY,
        reminderDaysBefore: [1, 3],
        category: null,
        reminders: [],
        attachments: [],
      };

      mockPrismaService.item.findFirst.mockResolvedValue(originalItem);
      mockPrismaService.item.update.mockResolvedValue({
        ...originalItem,
        status: ItemStatus.COMPLETED,
        completedAt: new Date(),
      });
      mockPrismaService.item.create.mockResolvedValue({
        ...originalItem,
        id: 'item-2',
        dueDate: new Date('2026-02-28T00:00:00Z'),
      });
      mockPrismaService.activity.create.mockResolvedValue({});
      mockPrismaService.inAppNotification.create.mockResolvedValue({});

      const result = await service.complete('user-1', 'item-1');

      expect(result.completedItem.status).toBe(ItemStatus.COMPLETED);
      expect(result.nextRecurringItem).toBeDefined();
      expect(mockPrismaService.item.create).toHaveBeenCalled();
    });

    it('should automatically process recurring schedules and spawn next cycle for overdue pending recurring items', async () => {
      const overdueItem = {
        id: 'item-recurring',
        userId: 'user-1',
        title: 'Gym Membership',
        type: ItemType.BILL,
        status: ItemStatus.PENDING,
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day overdue
        amount: '50.00',
        currency: 'USD',
        recurrence: Recurrence.MONTHLY,
        reminderDaysBefore: [2],
        category: null,
      };

      mockPrismaService.item.findMany.mockResolvedValueOnce([overdueItem]);
      mockPrismaService.item.findFirst.mockResolvedValueOnce(null); // No next cycle yet
      mockPrismaService.item.create.mockResolvedValueOnce({
        ...overdueItem,
        id: 'item-recurring-next',
      });
      mockPrismaService.activity.create.mockResolvedValue({});
      mockPrismaService.inAppNotification.create.mockResolvedValue({});

      await service.processRecurringSchedules();

      expect(mockPrismaService.item.findMany).toHaveBeenCalled();
      expect(mockPrismaService.item.create).toHaveBeenCalled();
    });
  });
});
