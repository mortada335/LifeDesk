'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ItemType, Priority, ItemStatus } from '@lifedesk/types';
import { useTranslation } from 'react-i18next';

export function PriorityBadge({ priority }: { priority: Priority | string }) {
  const { t } = useTranslation();
  const p = String(priority || '').toUpperCase();

  const map: Record<string, string> = {
    [Priority.HIGH]: 'bg-rose-50 text-rose-700 border-rose-200',
    [Priority.MEDIUM]: 'bg-amber-50 text-amber-700 border-amber-200',
    [Priority.LOW]: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const labels: Record<string, string> = {
    [Priority.HIGH]: t('common.priorities.high'),
    [Priority.MEDIUM]: t('common.priorities.medium'),
    [Priority.LOW]: t('common.priorities.low'),
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
        map[p] || 'bg-slate-50 text-slate-600 border-slate-200',
      )}
    >
      {labels[p] || p}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const { t } = useTranslation();
  const s = String(status || '').toUpperCase();

  const map: Record<string, string> = {
    [ItemStatus.PENDING]: 'bg-blue-50 text-blue-700 border-blue-200',
    [ItemStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [ItemStatus.CANCELLED]: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  const labels: Record<string, string> = {
    [ItemStatus.PENDING]: t('common.statuses.pending'),
    [ItemStatus.COMPLETED]: `✓ ${t('common.statuses.completed')}`,
    [ItemStatus.CANCELLED]: t('common.statuses.cancelled'),
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        map[s] || 'bg-slate-100 text-slate-600 border-slate-200',
      )}
    >
      {labels[s] || s}
    </span>
  );
}

export function TypeBadge({ type }: { type: ItemType | string }) {
  const { t } = useTranslation();
  const tp = String(type || '').toUpperCase();

  const styles: Record<string, string> = {
    [ItemType.BILL]: 'bg-red-50 text-red-700 border-red-200',
    [ItemType.SUBSCRIPTION]: 'bg-purple-50 text-purple-700 border-purple-200',
    [ItemType.DOCUMENT]: 'bg-amber-50 text-amber-700 border-amber-200',
    [ItemType.APPOINTMENT]: 'bg-blue-50 text-blue-700 border-blue-200',
    [ItemType.TASK]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [ItemType.OTHER]: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const icons: Record<string, string> = {
    [ItemType.BILL]: `💳 ${t('common.types.bill')}`,
    [ItemType.SUBSCRIPTION]: `🔄 ${t('common.types.subscription')}`,
    [ItemType.DOCUMENT]: `📄 ${t('common.types.document')}`,
    [ItemType.APPOINTMENT]: `🩺 ${t('common.types.appointment')}`,
    [ItemType.TASK]: `📋 ${t('common.types.task')}`,
    [ItemType.OTHER]: `📌 ${t('common.types.other')}`,
  };

  return (
    <span
      className={twMerge(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border shadow-2xs',
        styles[tp] || 'bg-gray-100 text-gray-700 border-gray-200',
      )}
    >
      {icons[tp] || tp}
    </span>
  );
}
