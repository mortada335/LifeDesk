'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LifeItemDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { TypeBadge, PriorityBadge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [selectedItem, setSelectedItem] = useState<LifeItemDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: items = [] } = useQuery<LifeItemDto[]>({
    queryKey: ['items'],
    queryFn: () => apiClient<LifeItemDto[]>('/items'),
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create grid cells
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('calendar.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('calendar.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <span className="text-xs font-bold text-slate-800 px-3 min-w-[140px] text-center">
            {monthName}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/75 text-center py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {daysOfWeek.map((dayName, idx) => (
              <span key={idx}>{dayName}</span>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
            {days.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="bg-slate-50/30 p-2 min-h-[90px]" />;
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
                  className={`p-2 min-h-[100px] transition-colors flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 ring-2 ring-inset ring-indigo-400'
                      : isToday
                      ? 'bg-indigo-50/30 hover:bg-indigo-50/50'
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : isSelected
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1 rounded">
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
                        className="text-[10px] p-1.5 rounded-md border bg-white truncate font-medium text-slate-800 shadow-2xs hover:border-indigo-400 cursor-pointer flex items-center gap-1"
                        style={{
                          borderInlineStartColor: item.category?.color || '#6366f1',
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

        {/* Selected Day Agenda Drawer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                {t('calendar.title')}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                {selectedDay
                  ? `${currentDate.toLocaleDateString(i18n.language, { month: 'short' })} ${selectedDay}, ${year}`
                  : t('calendar.title')}
              </h3>
            </div>
            {selectedDay && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">
                {selectedDayItems.length}
              </span>
            )}
          </div>

          <div className="mt-4 flex-1 overflow-y-auto space-y-2.5">
            {!selectedDay ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {t('calendar.noItemsForDay')}
              </div>
            ) : selectedDayItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {t('calendar.noItemsForDay')}
              </div>
            ) : (
              selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setIsDetailsOpen(true);
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate me-2">
                      {item.title}
                    </span>
                    <PriorityBadge priority={item.priority} />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <TypeBadge type={item.type} />
                    {item.amount && (
                      <span className="font-bold text-emerald-700">${Number(item.amount).toFixed(2)}</span>
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
    </div>
  );
}
