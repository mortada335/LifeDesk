'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LifeItemDto, ItemType, Priority, ItemStatus } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge, TypeBadge } from '@/components/ui/badge';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { CreateItemModal } from '@/components/items/create-item-modal';
import { Plus, Search, FileText, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ItemsPage() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<LifeItemDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery<LifeItemDto[]>({
    queryKey: ['items', search, selectedType, selectedStatus, selectedPriority],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPriority) params.append('priority', selectedPriority);
      return apiClient<LifeItemDto[]>(`/items?${params.toString()}`);
    },
  });

  const handleExportCSV = () => {
    if (!items || items.length === 0) return;

    const headers = ['Title', 'Type', 'Status', 'Priority', 'Due Date', 'Amount', 'Currency', 'Recurrence'];
    const rows = items.map((item) => [
      `"${(item.title || '').replace(/"/g, '""')}"`,
      item.type,
      item.status,
      item.priority,
      item.dueDate ? item.dueDate.split('T')[0] : '',
      item.amount !== null && item.amount !== undefined ? item.amount : '',
      'USD',
      item.recurrence || 'NONE',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lifedesk-commitments-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('items.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('items.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            disabled={items.length === 0}
            title={t('items.exportCsv')}
          >
            <Download className="w-4 h-4 me-1.5 shrink-0" /> {t('items.exportCsv')}
          </Button>

          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 me-1.5 shrink-0" /> {t('items.addCommitment')}
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('items.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-start"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Select
            options={[
              { label: t('items.allTypes'), value: '' },
              { label: t('common.types.bill'), value: ItemType.BILL },
              { label: t('common.types.subscription'), value: ItemType.SUBSCRIPTION },
              { label: t('common.types.document'), value: ItemType.DOCUMENT },
              { label: t('common.types.appointment'), value: ItemType.APPOINTMENT },
              { label: t('common.types.task'), value: ItemType.TASK },
              { label: t('common.types.other'), value: ItemType.OTHER },
            ]}
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          />

          <Select
            options={[
              { label: t('items.allStatuses'), value: '' },
              { label: t('common.statuses.pending'), value: ItemStatus.PENDING },
              { label: t('common.statuses.completed'), value: ItemStatus.COMPLETED },
              { label: t('common.statuses.cancelled'), value: ItemStatus.CANCELLED },
            ]}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />

          <Select
            options={[
              { label: t('items.allPriorities'), value: '' },
              { label: t('common.priorities.high'), value: Priority.HIGH },
              { label: t('common.priorities.medium'), value: Priority.MEDIUM },
              { label: t('common.priorities.low'), value: Priority.LOW },
            ]}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          />
        </div>
      </div>

      {/* Commitments Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 sm:px-6 text-start">{t('common.title')} & {t('common.type')}</th>
                <th className="py-3 px-4 text-start">{t('common.dueDate')}</th>
                <th className="py-3 px-4 text-start">{t('common.category')}</th>
                <th className="py-3 px-4 text-start">{t('common.amount')}</th>
                <th className="py-3 px-4 text-start">{t('common.status')}</th>
                <th className="py-3 px-4 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-700 mb-1">{t('items.noItemsFound')}</p>
                    <p>{t('items.noItemsFoundSub')}</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDetailsOpen(true);
                    }}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 sm:px-6 text-start">
                      <div className="font-semibold text-slate-900 text-sm">{item.title}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <TypeBadge type={item.type} />
                        <PriorityBadge priority={item.priority} />
                        {item.attachments && item.attachments.length > 0 && (
                          <span className="flex items-center gap-0.5 text-indigo-600">
                            <FileText className="w-3 h-3 shrink-0" />
                            {item.attachments.length}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-start">
                      <span
                        className={
                          item.isOverdue
                            ? 'text-rose-600 font-bold'
                            : item.isDueToday
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-600'
                        }
                      >
                        {item.isDueToday ? t('dashboard.dueTodayLabel') : new Date(item.dueDate).toLocaleDateString(i18n.language)}
                      </span>
                      {item.recurrence && item.recurrence !== 'NONE' && (
                        <p className="text-[10px] text-purple-600 font-medium">
                          {t('items.repeatingBadge', {
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
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-start">
                      {item.category ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ backgroundColor: `${item.category.color}15`, color: item.category.color }}
                        >
                          {item.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-start">
                      {item.amount !== null && item.amount !== undefined ? (
                        <span className="font-bold text-emerald-700">${Number(item.amount).toFixed(2)}</span>
                      ) : item.documentNumber ? (
                        <span className="font-mono text-slate-600">#{item.documentNumber}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-start">
                      <StatusBadge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-end whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setIsDetailsOpen(true);
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      <CreateItemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
