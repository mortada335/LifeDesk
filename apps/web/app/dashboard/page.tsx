'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import {
  DashboardSummary,
  LifeItemDto,
  ItemType,
  Priority,
  ItemStatus,
} from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { StatCard } from '@/components/ui/stat-card';
import { PriorityBadge, TypeBadge } from '@/components/ui/badge';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { CreateItemModal } from '@/components/items/create-item-modal';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Layers,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'all'>('today');
  const [selectedItem, setSelectedItem] = useState<LifeItemDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch Dashboard Summary Stats
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient<DashboardSummary>('/dashboard/summary'),
  });

  // Fetch Items according to active tab
  const { data: items = [], isLoading: itemsLoading } = useQuery<LifeItemDto[]>({
    queryKey: ['items', activeTab],
    queryFn: () => {
      let timeframe = activeTab === 'all' ? undefined : activeTab;
      return apiClient<LifeItemDto[]>(`/items${timeframe ? `?timeframe=${timeframe}` : ''}`);
    },
  });

  // Quick 1-Click Complete Mutation
  const completeMutation = useMutation({
    mutationFn: (itemId: string) => apiClient(`/items/${itemId}/complete`, { method: 'POST' }),
    onSuccess: () => {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });

  const handleOpenItem = (item: LifeItemDto) => {
    setSelectedItem(item);
    setIsDetailsOpen(true);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetingMorning');
    if (hour < 18) return t('dashboard.greetingAfternoon');
    return t('dashboard.greetingEvening');
  };

  return (
    <div className="space-y-7">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dashboard.welcomeSubtitle')}
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="sm:w-auto w-full">
          <Plus className="w-4 h-4 me-1.5 shrink-0" /> {t('dashboard.addNewItem')}
        </Button>
      </div>

      {/* Critical Overdue Banner (if any) */}
      {summary && summary.overdueCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">{t('dashboard.statsOverdueDesc')}</p>
              <p className="text-sm font-medium">
                {summary.overdueCount} {t('dashboard.overdueLabel')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setActiveTab('overdue')}
          >
            {t('dashboard.tabsOverdue')}
          </Button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.statsTodayDue')}
          value={summary?.todayCount ?? 0}
          subtitle={t('dashboard.statsTodayDueDesc')}
          icon={Clock}
          color="amber"
          onClick={() => setActiveTab('today')}
        />
        <StatCard
          title={t('dashboard.statsUpcoming')}
          value={summary?.upcomingCount ?? 0}
          subtitle={t('dashboard.statsUpcomingDesc')}
          icon={Calendar}
          color="blue"
          onClick={() => setActiveTab('upcoming')}
        />
        <StatCard
          title={t('dashboard.statsOverdue')}
          value={summary?.overdueCount ?? 0}
          subtitle={t('dashboard.statsOverdueDesc')}
          icon={AlertCircle}
          color="red"
          onClick={() => setActiveTab('overdue')}
        />
        <StatCard
          title={t('dashboard.statsCompleted')}
          value={summary?.completedCount ?? 0}
          subtitle={t('dashboard.statsCompletedDesc')}
          icon={CheckCircle2}
          color="emerald"
          onClick={() => setActiveTab('all')}
        />
      </div>

      {/* Monthly Expenditure & Categories Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expense Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('items.totalAmount')}
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3">
              ${summary?.monthlyExpenditure?.toFixed(2) ?? '0.00'}{' '}
              <span className="text-sm font-semibold text-slate-400 uppercase">USD</span>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {t('landing.featureRecurrenceDesc')}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{t('landing.featureRadarTitle')}</span>
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              🔔 {summary?.activeRemindersCount ?? 0}
            </span>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('categories.title')}
            </span>
            <a
              href="/dashboard/categories"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {t('categories.title')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </a>
          </div>

          {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summary.categoryBreakdown.slice(0, 8).map((cat) => (
                <div
                  key={cat.categoryName}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-medium text-slate-800 truncate">{cat.categoryName}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 mt-2">{cat.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              {t('categories.subtitle')}
            </div>
          )}
        </div>
      </div>

      {/* Main Agenda Section with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'today'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsToday')} ({summary?.todayCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsUpcoming')} ({summary?.upcomingCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'overdue'
                  ? 'bg-rose-50 text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsOverdue')} ({summary?.overdueCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsAll')}
            </button>
          </div>

          <a
            href="/dashboard/items"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            {t('items.title')} <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </a>
        </div>

        {/* Item List */}
        <div className="divide-y divide-slate-100">
          {itemsLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">{t('common.loading')}</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-indigo-400 mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">
                {activeTab === 'today'
                  ? t('dashboard.emptyTodayTitle')
                  : activeTab === 'overdue'
                  ? t('dashboard.emptyOverdueTitle')
                  : t('dashboard.emptyAllTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                {activeTab === 'today'
                  ? t('dashboard.emptyTodayDesc')
                  : activeTab === 'overdue'
                  ? t('dashboard.emptyOverdueDesc')
                  : t('dashboard.emptyAllDesc')}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="w-3.5 h-3.5 me-1 shrink-0" /> {t('dashboard.addNewItem')}
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const isOverdue = item.isOverdue;
              const isToday = item.isDueToday;
              const isCompleted = item.status === ItemStatus.COMPLETED;

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer ${
                    isOverdue ? 'bg-rose-50/20' : ''
                  }`}
                  onClick={() => handleOpenItem(item)}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Quick Complete Checkbox */}
                    <button
                      type="button"
                      disabled={isCompleted || completeMutation.isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        completeMutation.mutate(item.id);
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-emerald-500 text-transparent hover:text-emerald-500'
                      }`}
                      title={t('dashboard.completeAction')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold truncate ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </span>
                        <TypeBadge type={item.type} />
                        <PriorityBadge priority={item.priority} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span
                          className={`font-medium ${
                            isOverdue
                              ? 'text-rose-600 font-bold'
                              : isToday
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          📅 {isToday ? t('dashboard.dueTodayLabel') : new Date(item.dueDate).toLocaleDateString(i18n.language)}
                          {item.hasSpecificTime &&
                            ` ${new Date(item.dueDate).toLocaleTimeString(i18n.language, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}`}
                        </span>

                        {item.category && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.category.color }}
                            />
                            {item.category.name}
                          </span>
                        )}

                        {item.amount !== null && item.amount !== undefined && (
                          <span className="font-semibold text-emerald-700">
                            ${Number(item.amount).toFixed(2)} USD
                          </span>
                        )}

                        {item.attachments && item.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-indigo-600 font-medium">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            {item.attachments.length} {t('modals.attachmentsSection')}
                          </span>
                        )}

                        {item.recurrence && item.recurrence !== 'NONE' && (
                          <span className="text-purple-600 font-medium">
                            🔄 {t('items.repeatingBadge', {
                              freq:
                                item.recurrence === 'DAILY'
                                  ? t('common.recurrence.daily')
                                  : item.recurrence === 'WEEKLY'
                                  ? t('common.recurrence.weekly')
                                  : item.recurrence === 'MONTHLY'
                                  ? t('common.recurrence.monthly')
                                  : item.recurrence === 'YEARLY'
                                  ? t('common.recurrence.yearly')
                                  : item.recurrence,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenItem(item);
                      }}
                    >
                      {t('common.edit')}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Item Details Drawer Modal */}
      <ItemDetailsModal
        item={selectedItem}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Create Modal */}
      <CreateItemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
