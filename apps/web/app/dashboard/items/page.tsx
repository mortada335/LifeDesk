'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeItemDto, ItemType, Priority, ItemStatus, CategoryDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PriorityBadge, StatusBadge, TypeBadge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { CreateItemModal } from '@/components/items/create-item-modal';
import {
  Plus,
  Search,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
  Filter,
  Sparkles,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

function ItemsContent() {
  const { t, i18n } = useTranslation();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const urlCategory = searchParams.get('categoryId') || '';
  const urlSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(urlSearch);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(urlCategory);

  const [selectedItem, setSelectedItem] = useState<LifeItemDto | null>(null);
  const [itemToDelete, setItemToDelete] = useState<LifeItemDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (urlCategory) setSelectedCategoryId(urlCategory);
    if (urlSearch) setSearch(urlSearch);
  }, [urlCategory, urlSearch]);

  const { data: categories = [] } = useQuery<CategoryDto[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient<CategoryDto[]>('/categories'),
  });

  const { data: itemsResponse, isLoading } = useQuery<{
    data: LifeItemDto[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: [
      'items',
      search,
      selectedType,
      selectedStatus,
      selectedPriority,
      selectedCategoryId,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      params.append('page', String(page));
      params.append('limit', String(limit));
      return apiClient(`/items?${params.toString()}`);
    },
  });

  const items = itemsResponse?.data ?? [];
  const pagination = itemsResponse?.pagination ?? { page: 1, limit, total: 0, totalPages: 1 };

  // 1-Click Complete Mutation with Optimistic UI
  const completeMutation = useMutation({
    mutationFn: (itemId: string) => apiClient(`/items/${itemId}/complete`, { method: 'POST' }),
    onMutate: async (itemId: string) => {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      await queryClient.cancelQueries({
        queryKey: [
          'items',
          search,
          selectedType,
          selectedStatus,
          selectedPriority,
          selectedCategoryId,
          page,
        ],
      });

      const previous = queryClient.getQueryData<{
        data: LifeItemDto[];
        pagination: any;
      }>([
        'items',
        search,
        selectedType,
        selectedStatus,
        selectedPriority,
        selectedCategoryId,
        page,
      ]);

      if (previous) {
        queryClient.setQueryData(
          [
            'items',
            search,
            selectedType,
            selectedStatus,
            selectedPriority,
            selectedCategoryId,
            page,
          ],
          {
            ...previous,
            data: previous.data.map((it) =>
              it.id === itemId ? { ...it, status: ItemStatus.COMPLETED } : it,
            ),
          },
        );
      }

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [
            'items',
            search,
            selectedType,
            selectedStatus,
            selectedPriority,
            selectedCategoryId,
            page,
          ],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  // Direct Row Item Deletion Mutation
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => apiClient(`/items/${itemId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      setItemToDelete(null);
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

  const hasActiveFilters = Boolean(
    search || selectedType || selectedStatus || selectedPriority || selectedCategoryId,
  );

  const resetFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedCategoryId('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>{pagination.total} {t('nav.allCommitments')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t('items.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('items.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            disabled={items.length === 0}
            title={t('items.exportCsv')}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>{t('items.exportCsv')}</span>
          </Button>

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

      {/* Filters Bar (Linear-style) */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute start-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('items.searchPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 text-start bg-slate-50/50 hover:bg-white transition-colors"
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetFilters}
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t('common.cancel')}</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
          />

          <Select
            options={[
              { label: t('items.allStatuses'), value: '' },
              { label: t('common.statuses.pending'), value: ItemStatus.PENDING },
              { label: t('common.statuses.completed'), value: ItemStatus.COMPLETED },
              { label: t('common.statuses.cancelled'), value: ItemStatus.CANCELLED },
            ]}
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          />

          <Select
            options={[
              { label: t('items.allPriorities'), value: '' },
              { label: t('common.priorities.high'), value: Priority.HIGH },
              { label: t('common.priorities.medium'), value: Priority.MEDIUM },
              { label: t('common.priorities.low'), value: Priority.LOW },
            ]}
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPage(1);
            }}
          />

          <Select
            options={[
              { label: t('categories.title'), value: '' },
              ...categories.map((c) => ({ label: c.name, value: c.id })),
            ]}
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Commitments Table / List */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 sm:px-6 text-start">{t('items.tableTitle')}</th>
                <th className="py-3 px-4 text-start">{t('items.tableDueDate')}</th>
                <th className="py-3 px-4 text-start">{t('items.tableCategory')}</th>
                <th className="py-3 px-4 text-start">{t('items.tableDetails')}</th>
                <th className="py-3 px-4 text-start">{t('items.tableStatus')}</th>
                <th className="py-3 px-4 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>{t('items.loadingItems')}</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-800 mb-1">{t('items.noItemsFound')}</p>
                    <p className="text-slate-400">{t('items.noItemsFoundSub')}</p>
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isCompleted = item.status === ItemStatus.COMPLETED;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDetailsOpen(true);
                      }}
                      className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={isCompleted || completeMutation.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              completeMutation.mutate(item.id);
                            }}
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent hover:text-emerald-600'
                            }`}
                            title={t('dashboard.completeAction')}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                          <div>
                            <div
                              className={`font-bold text-sm transition-colors ${
                                isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-indigo-600'
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <TypeBadge type={item.type} />
                              <PriorityBadge priority={item.priority} />
                              {item.attachments && item.attachments.length > 0 && (
                                <span className="flex items-center gap-0.5 text-indigo-600 font-semibold text-[11px]">
                                  <FileText className="w-3 h-3 shrink-0" />
                                  {item.attachments.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-start">
                        <span
                          className={`font-semibold ${
                            item.isOverdue
                              ? 'text-rose-600 font-bold'
                              : item.isDueToday
                              ? 'text-amber-600 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          {item.isDueToday ? t('dashboard.dueTodayLabel') : new Date(item.dueDate).toLocaleDateString(i18n.language)}
                        </span>
                        {item.recurrence && item.recurrence !== 'NONE' && (
                          <p className="text-[10px] text-purple-600 font-semibold">
                            🔄 {item.recurrence}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-start">
                        {item.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ backgroundColor: `${item.category.color}15`, color: item.category.color }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: item.category.color }}
                            />
                            {item.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-start">
                        {item.amount !== null && item.amount !== undefined ? (
                          <span className="font-bold text-emerald-700 font-mono">
                            ${Number(item.amount).toFixed(2)}
                          </span>
                        ) : item.documentNumber ? (
                          <span className="font-mono text-slate-500 font-medium">#{item.documentNumber}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-start">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-3.5 px-4 text-end whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                            {t('common.edit')} →
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50 gap-4">
            <span className="text-xs text-slate-500 font-medium">
              {t('common.pagination.showing', {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{t('common.pagination.previous')}</span>
              </Button>

              <span className="text-xs font-bold text-slate-700 px-2 font-mono">
                {page} / {pagination.totalPages || 1}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>{t('common.pagination.next')}</span>
                <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      <ItemDetailsModal
        isOpen={isDetailsOpen}
        item={selectedItem}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedItem(null);
        }}
      />

      {/* Create Item Modal */}
      <CreateItemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Table Row Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            deleteMutation.mutate(itemToDelete.id);
          }
        }}
        title={t('items.deleteConfirmTitle')}
        message={itemToDelete ? t('items.deleteItemConfirm', { title: itemToDelete.title }) : ''}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span className="text-xs font-medium">Loading LifeDesk commitments...</span>
        </div>
      }
    >
      <ItemsContent />
    </Suspense>
  );
}
