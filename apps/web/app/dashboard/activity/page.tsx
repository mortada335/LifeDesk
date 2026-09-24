'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { CheckCircle, PlusCircle, RefreshCw, Trash2, Paperclip, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ActivityPage() {
  const { t, i18n } = useTranslation();
  const { data: activities = [], isLoading } = useQuery<ActivityDto[]>({
    queryKey: ['activity'],
    queryFn: () => apiClient<ActivityDto[]>('/activity'),
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ITEM_CREATED':
        return {
          icon: PlusCircle,
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          label: t('activity.actions.created'),
        };
      case 'ITEM_COMPLETED':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          label: t('activity.actions.completed'),
        };
      case 'ITEM_RECURRENCE_SPAWNED':
        return {
          icon: RefreshCw,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          label: t('activity.actions.recurrenceSpawned'),
        };
      case 'ITEM_UPDATED':
        return {
          icon: Edit3,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          label: t('activity.actions.updated'),
        };
      case 'ITEM_DELETED':
        return {
          icon: Trash2,
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          label: t('activity.actions.deleted'),
        };
      case 'ATTACHMENT_ADDED':
        return {
          icon: Paperclip,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          label: t('activity.actions.attachmentAdded'),
        };
      default:
        return {
          icon: PlusCircle,
          color: 'text-slate-600 bg-slate-50 border-slate-200',
          label: action,
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('activity.title')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('activity.subtitle')}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">{t('activity.loadingTimeline')}</div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">{t('activity.noActivity')}</div>
        ) : (
          <div className="relative border-s border-slate-200 ms-4 space-y-6">
            {activities.map((act) => {
              const meta = getActionBadge(act.action);
              const Icon = meta.icon;

              return (
                <div key={act.id} className="relative ps-6">
                  {/* Timeline dot */}
                  <span
                    className={`absolute -start-3 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${meta.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{meta.label}</span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        "{act.itemTitle || t('activity.obligationFallback')}"
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(act.createdAt).toLocaleString(i18n.language, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
