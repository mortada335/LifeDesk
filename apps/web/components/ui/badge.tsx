'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';
import { ItemType, Priority, ItemStatus } from '@lifedesk/types';
import { useTranslation } from 'react-i18next';
import { CreditCard, RefreshCw, FileText, Calendar, CheckSquare, Bookmark } from 'lucide-react';

export function PriorityBadge({ priority }: { priority: Priority | string }) {
  const { t } = useTranslation();
  const p = String(priority || '').toUpperCase();

  const configs: Record<string, { bg: string; dot: string; text: string; border: string }> = {
    [Priority.HIGH]: {
      bg: 'bg-rose-50/80',
      dot: 'bg-rose-500 animate-pulse',
      text: 'text-rose-700',
      border: 'border-rose-200/80',
    },
    [Priority.MEDIUM]: {
      bg: 'bg-amber-50/80',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      border: 'border-amber-200/80',
    },
    [Priority.LOW]: {
      bg: 'bg-slate-50',
      dot: 'bg-slate-400',
      text: 'text-slate-600',
      border: 'border-slate-200',
    },
  };

  const labels: Record<string, string> = {
    [Priority.HIGH]: t('common.priorities.high'),
    [Priority.MEDIUM]: t('common.priorities.medium'),
    [Priority.LOW]: t('common.priorities.low'),
  };

  const current = configs[p] || configs[Priority.LOW];

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all',
        current.bg,
        current.text,
        current.border,
      )}
    >
      <span className={twMerge('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />
      {labels[p] || p}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const { t } = useTranslation();
  const s = String(status || '').toUpperCase();

  const configs: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    [ItemStatus.PENDING]: {
      bg: 'bg-blue-50/80',
      text: 'text-blue-700',
      border: 'border-blue-200/80',
      dot: 'bg-blue-500',
    },
    [ItemStatus.COMPLETED]: {
      bg: 'bg-emerald-50/80',
      text: 'text-emerald-700',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
    },
    [ItemStatus.CANCELLED]: {
      bg: 'bg-slate-100',
      text: 'text-slate-500',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const labels: Record<string, string> = {
    [ItemStatus.PENDING]: t('common.statuses.pending'),
    [ItemStatus.COMPLETED]: t('common.statuses.completed'),
    [ItemStatus.CANCELLED]: t('common.statuses.cancelled'),
  };

  const current = configs[s] || configs[ItemStatus.PENDING];

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border shadow-2xs',
        current.bg,
        current.text,
        current.border,
      )}
    >
      <span className={twMerge('w-1.5 h-1.5 rounded-full shrink-0', current.dot)} />
      {labels[s] || s}
    </span>
  );
}

export function TypeBadge({ type }: { type: ItemType | string }) {
  const { t } = useTranslation();
  const tp = String(type || '').toUpperCase();

  const styles: Record<string, { bg: string; text: string; border: string; icon: any }> = {
    [ItemType.BILL]: {
      bg: 'bg-rose-50/70',
      text: 'text-rose-700',
      border: 'border-rose-200/70',
      icon: CreditCard,
    },
    [ItemType.SUBSCRIPTION]: {
      bg: 'bg-purple-50/70',
      text: 'text-purple-700',
      border: 'border-purple-200/70',
      icon: RefreshCw,
    },
    [ItemType.DOCUMENT]: {
      bg: 'bg-amber-50/70',
      text: 'text-amber-700',
      border: 'border-amber-200/70',
      icon: FileText,
    },
    [ItemType.APPOINTMENT]: {
      bg: 'bg-sky-50/70',
      text: 'text-sky-700',
      border: 'border-sky-200/70',
      icon: Calendar,
    },
    [ItemType.TASK]: {
      bg: 'bg-emerald-50/70',
      text: 'text-emerald-700',
      border: 'border-emerald-200/70',
      icon: CheckSquare,
    },
    [ItemType.OTHER]: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: Bookmark,
    },
  };

  const labels: Record<string, string> = {
    [ItemType.BILL]: t('common.types.bill'),
    [ItemType.SUBSCRIPTION]: t('common.types.subscription'),
    [ItemType.DOCUMENT]: t('common.types.document'),
    [ItemType.APPOINTMENT]: t('common.types.appointment'),
    [ItemType.TASK]: t('common.types.task'),
    [ItemType.OTHER]: t('common.types.other'),
  };

  const current = styles[tp] || styles[ItemType.OTHER];
  const Icon = current.icon;

  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border',
        current.bg,
        current.text,
        current.border,
      )}
    >
      <Icon className="w-3 h-3 shrink-0 opacity-80" />
      <span>{labels[tp] || tp}</span>
    </span>
  );
}
