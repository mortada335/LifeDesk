'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  Trash2,
  Paperclip,
  Edit3,
  History,
  Sparkles,
} from 'lucide-react';
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
          color: 'text-slate-800 bg-slate-100 border-slate-200 shadow-2xs',
          label: t('activity.actions.created'),
        };
      case 'ITEM_COMPLETED':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-emerald-100',
          label: t('activity.actions.completed'),
        };
      case 'ITEM_RECURRENCE_SPAWNED':
      case 'ITEM_RECURRENCE_SCHEDULED':
        return {
          icon: RefreshCw,
          color: 'text-blue-700 bg-blue-50 border-blue-200 shadow-2xs',
          label: t('activity.actions.recurrenceSpawned'),
        };
      case 'ITEM_UPDATED':
        return {
          icon: Edit3,
          color: 'text-amber-600 bg-amber-50 border-amber-200 shadow-amber-100',
          label: t('activity.actions.updated'),
        };
      case 'ITEM_DELETED':
        return {
          icon: Trash2,
          color: 'text-rose-600 bg-rose-50 border-rose-200 shadow-rose-100',
          label: t('activity.actions.deleted'),
        };
      case 'ATTACHMENT_ADDED':
        return {
          icon: Paperclip,
          color: 'text-blue-600 bg-blue-50 border-blue-200 shadow-blue-100',
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{activities.length} {t('activity.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t('activity.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('activity.subtitle')}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>{t('activity.loadingTimeline')}</span>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">{t('activity.noActivity')}</p>
          </div>
        ) : (
          <div className="relative border-s-2 border-slate-100 ms-4 space-y-6">
            {activities.map((act) => {
              const meta = getActionBadge(act.action);
              const Icon = meta.icon;

              return (
                <div key={act.id} className="relative ps-6 group">
                  {/* Timeline icon pip */}
                  <span
                    className={`absolute -start-3.5 top-0.5 w-7 h-7 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs ${meta.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{meta.label}</span>
                      <span className="text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg truncate max-w-sm">
                        "{act.itemTitle || t('activity.obligationFallback')}"
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 font-mono">
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
