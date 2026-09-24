export const ItemType = {
  BILL: 'BILL',
  SUBSCRIPTION: 'SUBSCRIPTION',
  DOCUMENT: 'DOCUMENT',
  APPOINTMENT: 'APPOINTMENT',
  TASK: 'TASK',
  OTHER: 'OTHER',
} as const;
export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const ItemStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const Recurrence = {
  NONE: 'NONE',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
} as const;
export type Recurrence = (typeof Recurrence)[keyof typeof Recurrence];

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  timezone: string;
  currency: string;
  startOfWeek?: string;
  dateFormat?: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}

export interface CategoryDto {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId?: string | null;
  itemCount?: number;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface ReminderDto {
  id: string;
  remindAt: string;
  isTriggered: boolean;
}

export interface LifeItemDto {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  type: ItemType;
  status: ItemStatus;
  priority: Priority;
  categoryId?: string | null;
  category?: CategoryDto | null;
  dueDate: string;
  hasSpecificTime: boolean;
  amount?: number | null;
  documentNumber?: string | null;
  issuingAuthority?: string | null;
  recurrence: Recurrence;
  reminderDaysBefore: number[];
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: AttachmentDto[];
  reminders?: ReminderDto[];

  // Computed fields for UI
  isOverdue?: boolean;
  isDueToday?: boolean;
  daysRemaining?: number;
}

export interface CreateItemDto {
  title: string;
  description?: string;
  type: ItemType;
  priority?: Priority;
  categoryId?: string;
  dueDate: string;
  hasSpecificTime?: boolean;
  amount?: number;
  documentNumber?: string;
  issuingAuthority?: string;
  recurrence?: Recurrence;
  reminderDaysBefore?: number[];
}

export interface UpdateItemDto extends Partial<CreateItemDto> {
  status?: ItemStatus;
}

export interface DashboardSummary {
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  completedCount: number;
  activeRemindersCount: number;
  monthlyExpenditure: number; // Total bills + subscriptions for current month in USD
  categoryBreakdown: {
    categoryName: string;
    count: number;
    color: string;
  }[];
}

export interface ActivityDto {
  id: string;
  action: string;
  details?: Record<string, any> | null;
  createdAt: string;
  itemTitle?: string;
}

export interface InAppNotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING_REMINDER';
  itemId?: string | null;
  isRead: boolean;
  createdAt: string;
}
