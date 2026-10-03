'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeItemDto, ItemStatus } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { PriorityBadge, TypeBadge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { CreateItemModal } from '@/components/items/create-item-modal';
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  ArrowRight,
  DollarSign,
  FileText,
  Sparkles,
  Zap,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

interface DashboardSummary {
  todayCount: number;
  upcomingCount: number;
  overdueCount: number;
  completedCount: number;
  totalActiveCount: number;
  monthlyExpenditure: number;
  activeRemindersCount: number;
  categoryBreakdown: { categoryName: string; color: string; count: number }[];
}

export default function DashboardOverviewPage() {
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
  const { data: itemsResponse, isLoading: itemsLoading } = useQuery<{
    data: LifeItemDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['items', activeTab],
    queryFn: () => {
      const timeframe = activeTab === 'all' ? undefined : activeTab;
      return apiClient(`/items${timeframe ? `?timeframe=${timeframe}` : ''}`);
    },
  });
  const items = itemsResponse?.data ?? [];

  // Quick 1-Click Complete Mutation with Optimistic Updates
  const completeMutation = useMutation({
    mutationFn: (itemId: string) => apiClient(`/items/${itemId}/complete`, { method: 'POST' }),
    onMutate: async (itemId: string) => {
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      await queryClient.cancelQueries({ queryKey: ['items', activeTab] });
      await queryClient.cancelQueries({ queryKey: ['dashboard-summary'] });

      const previousItems = queryClient.getQueryData<{
        data: LifeItemDto[];
        pagination: any;
      }>(['items', activeTab]);

      const previousSummary = queryClient.getQueryData<DashboardSummary>(['dashboard-summary']);

      if (previousItems) {
        queryClient.setQueryData(['items', activeTab], {
          ...previousItems,
          data: previousItems.data.filter((it) => it.id !== itemId),
          pagination: {
            ...previousItems.pagination,
            total: Math.max(0, (previousItems.pagination?.total || 1) - 1),
          },
        });
      }

      if (previousSummary) {
        const itemToComplete = previousItems?.data.find((it) => it.id === itemId);
        queryClient.setQueryData<DashboardSummary>(['dashboard-summary'], {
          ...previousSummary,
          completedCount: previousSummary.completedCount + 1,
          todayCount:
            itemToComplete?.isDueToday
              ? Math.max(0, previousSummary.todayCount - 1)
              : previousSummary.todayCount,
          overdueCount:
            itemToComplete?.isOverdue
              ? Math.max(0, previousSummary.overdueCount - 1)
              : previousSummary.overdueCount,
          upcomingCount:
            !itemToComplete?.isDueToday && !itemToComplete?.isOverdue
              ? Math.max(0, previousSummary.upcomingCount - 1)
              : previousSummary.upcomingCount,
        });
      }

      return { previousItems, previousSummary };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['items', activeTab], context.previousItems);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(['dashboard-summary'], context.previousSummary);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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

  const todayFormatted = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-8">
      {/* Hero Welcome HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {getGreeting()}, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('dashboard.welcomeSubtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="gradient"
          size="md"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t('dashboard.addNewItem')}</span>
        </Button>
      </div>

      {/* Critical Overdue Banner (if any) */}
      {summary && summary.overdueCount > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-500/10 via-rose-50/60 to-rose-100/40 border border-rose-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-950 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-sm shadow-rose-500/30 shrink-0">
              <AlertCircle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
                {t('dashboard.statsOverdueDesc')}
              </p>
              <p className="text-sm font-bold text-rose-950 mt-0.5">
                {summary.overdueCount} {t('dashboard.overdueLabel')}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setActiveTab('overdue')}
          >
            {t('dashboard.tabsOverdue')}
          </Button>
        </div>
      )}

      {/* KPI Metric HUD Cards */}
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

      {/* Financial & Category Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Expense Card */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('items.totalAmount')}
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900 mt-3 font-mono">
              ${summary?.monthlyExpenditure?.toFixed(2) ?? '0.00'}{' '}
              <span className="text-xs font-semibold text-slate-400 uppercase">USD</span>
            </p>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {t('landing.featureRecurrenceDesc')}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>{t('landing.featureRadarTitle')}</span>
            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
              🔔 {summary?.activeRemindersCount ?? 0}
            </span>
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('categories.title')}
            </span>
            <a
              href="/dashboard/categories"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              <span>{t('categories.title')}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
            </a>
          </div>

          {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {summary.categoryBreakdown.slice(0, 8).map((cat) => (
                <div
                  key={cat.categoryName}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {cat.categoryName}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 mt-2 font-mono">{cat.count}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              {t('categories.subtitle')}
            </div>
          )}
        </div>
      </div>

      {/* Main Agenda Section (Linear-grade) */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Tab Headers */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/40">
          <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsToday')} ({summary?.todayCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsUpcoming')} ({summary?.upcomingCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('overdue')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsOverdue')} ({summary?.overdueCount ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all duration-150 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.tabsAll')}
            </button>
          </div>

          <a
            href="/dashboard/items"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
          >
            <span>{t('items.title')}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
          </a>
        </div>

        {/* Item List */}
        <div className="divide-y divide-slate-100">
          {itemsLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>{t('common.loading')}</span>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {activeTab === 'today'
                  ? t('dashboard.emptyTodayTitle')
                  : activeTab === 'overdue'
                  ? t('dashboard.emptyOverdueTitle')
                  : t('dashboard.emptyAllTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
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
                  onClick={() => handleOpenItem(item)}
                  className={`group p-4 sm:px-6 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                    isOverdue ? 'bg-rose-50/20' : ''
                  }`}
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
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                      }`}
                      title={t('dashboard.completeAction')}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold truncate transition-colors ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-indigo-600'
                          }`}
                        >
                          {item.title}
                        </span>
                        <TypeBadge type={item.type} />
                        <PriorityBadge priority={item.priority} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue
                              ? 'text-rose-600 font-bold'
                              : isToday
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          <span>📅</span>
                          <span>
                            {isToday ? t('dashboard.dueTodayLabel') : new Date(item.dueDate).toLocaleDateString(i18n.language)}
                          </span>
                        </span>

                        {item.category && (
                          <span className="flex items-center gap-1 text-slate-600">
                            <span
                              className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: item.category.color }}
                            />
                            <span>{item.category.name}</span>
                          </span>
                        )}

                        {item.amount !== null && item.amount !== undefined && (
                          <span className="font-bold text-emerald-700 font-mono">
                            ${Number(item.amount).toFixed(2)} USD
                          </span>
                        )}

                        {item.attachments && item.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span>{item.attachments.length}</span>
                          </span>
                        )}

                        {item.recurrence && item.recurrence !== 'NONE' && (
                          <span className="text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.2 rounded">
                            🔄 {item.recurrence}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 group-hover:text-slate-600">
                      {t('common.edit')} →
                    </span>
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
