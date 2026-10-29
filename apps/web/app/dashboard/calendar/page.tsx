'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeItemDto, ItemStatus } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { CreateItemModal } from '@/components/items/create-item-modal';
import { TypeBadge, PriorityBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar as CalendarIcon,
  Check,
  Clock,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [selectedItem, setSelectedItem] = useState<LifeItemDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

  const { data: itemsResponse, isLoading } = useQuery<{ data: LifeItemDto[] }>({
    queryKey: ['items', 'calendar', year, month],
    queryFn: () =>
      apiClient<{ data: LifeItemDto[] }>(
        `/items?startDate=${encodeURIComponent(startOfMonth)}&endDate=${encodeURIComponent(endOfMonth)}&limit=100`,
      ),
  });
  const items = itemsResponse?.data ?? [];

  const completeMutation = useMutation({
    mutationFn: (itemId: string) => apiClient(`/items/${itemId}/complete`, { method: 'POST' }),
    onMutate: async (itemId: string) => {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      await queryClient.cancelQueries({ queryKey: ['items', 'calendar', year, month] });
      const previous = queryClient.getQueryData<{ data: LifeItemDto[] }>([
        'items',
        'calendar',
        year,
        month,
      ]);

      if (previous) {
        queryClient.setQueryData(['items', 'calendar', year, month], {
          ...previous,
          data: previous.data.map((it) =>
            it.id === itemId ? { ...it, status: ItemStatus.COMPLETED } : it,
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['items', 'calendar', year, month], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const getItemsForDay = (day: number) => {
    return items.filter((item) => {
      const itemDate = new Date(item.dueDate);
      return (
        itemDate.getFullYear() === year &&
        itemDate.getMonth() === month &&
        itemDate.getDate() === day
      );
    });
  };

  const monthName = currentDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
  const selectedDayItems = selectedDay ? getItemsForDay(selectedDay) : [];
  const daysOfWeek = (t('calendar.daysOfWeek', { returnObjects: true }) as string[]) || [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{t('calendar.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {monthName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('calendar.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={jumpToToday}
          >
            {t('dashboard.tabsToday')}
          </Button>

          <div className="flex items-center gap-1 bg-white border border-slate-200/80 p-1 rounded-2xl shadow-xs">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-[110px] text-center">
              {monthName}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>

          <Button
            type="button"
            variant="gradient"
            size="md"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t('items.addCommitment')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid (Notion Calendar / Cron grade) */}
        <div className="lg:col-span-3 glass-card rounded-3xl overflow-hidden shadow-xs">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/75 text-center py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {daysOfWeek.map((dayName, idx) => (
              <span key={idx}>{dayName}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[520px]">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-slate-50/30 p-2 min-h-[95px]" />;
              }

              const dayItems = getItemsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              const isSelected = selectedDay === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`p-2 min-h-[105px] transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 ring-2 ring-inset ring-slate-900/20'
                      : isToday
                      ? 'bg-blue-50/40 hover:bg-blue-50/70'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold rounded-xl w-6 h-6 flex items-center justify-center transition-all ${
                        isToday
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-slate-800 font-bold bg-slate-100 border border-slate-200 px-1.5 rounded-full">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[85px]">
                    {dayItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setIsDetailsOpen(true);
                        }}
                        className={`text-[10px] p-1.5 rounded-lg border truncate font-semibold transition-all hover:scale-[1.02] flex items-center gap-1.5 shadow-2xs ${
                          item.status === ItemStatus.COMPLETED
                            ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200/60 line-through opacity-75'
                            : item.isOverdue
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-white text-slate-800 border-slate-200/80 hover:border-slate-400'
                        }`}
                        style={{
                          borderInlineStartColor: item.category?.color || '#0f172a',
                          borderInlineStartWidth: '3px',
                        }}
                        title={item.title}
                      >
                        <span className="truncate">{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Drawer (Cron style) */}
        <div className="glass-card rounded-3xl p-5 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {t('calendar.title')}
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">
                {selectedDay
                  ? `${currentDate.toLocaleDateString(i18n.language, { month: 'short' })} ${selectedDay}, ${year}`
                  : t('calendar.title')}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedDay && (
                <>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-full font-mono">
                    {selectedDayItems.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="p-1 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title={t('items.addCommitment')}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-2.5">
            {!selectedDay || selectedDayItems.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-3">
                <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">{t('calendar.noItemsForDay')}</p>
                {selectedDay && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreateOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('items.addCommitment')}</span>
                  </Button>
                )}
              </div>
            ) : (
              selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setIsDetailsOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 group ${
                    item.status === ItemStatus.COMPLETED
                      ? 'bg-emerald-50/60 border-emerald-200/80 text-emerald-950'
                      : 'bg-white hover:bg-slate-50 border-slate-200/70 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold truncate me-2 transition-colors ${
                        item.status === ItemStatus.COMPLETED
                          ? 'line-through text-slate-400'
                          : 'text-slate-900 group-hover:text-blue-600'
                      }`}
                    >
                      {item.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <PriorityBadge priority={item.priority} />
                      {item.status !== ItemStatus.COMPLETED ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            completeMutation.mutate(item.id);
                          }}
                          className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title={t('dashboard.completeAction')}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="p-0.5 text-emerald-600">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <TypeBadge type={item.type} />
                    {item.amount && (
                      <span className="font-bold text-emerald-700 font-mono">
                        ${Number(item.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ItemDetailsModal
        item={selectedItem}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedItem(null);
        }}
      />

      <CreateItemModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultDueDate={
          selectedDay
            ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
            : undefined
        }
      />
    </div>
  );
}
