import { Test, TestingModule } from '@nestjs/testing';
import { ItemsService } from './items.service';
import { PrismaService } from '../prisma/prisma.service';
import { ItemType, Recurrence, Priority, ItemStatus } from '@lifedesk/types';

describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    item: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
    inAppNotification: {
      create: jest.fn(),
    },
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
});
