'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Plus, Trash2, FolderKanban, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PRESET_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

export default function CategoriesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryDto | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery<CategoryDto[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient<CategoryDto[]>('/categories'),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient('/categories', { method: 'POST', body: { name, color } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsModalOpen(false);
      setName('');
      setColor('#6366f1');
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setCategoryToDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{categories.length} {t('categories.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {t('categories.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('categories.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{t('categories.newCategory')}</span>
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>{t('categories.loadingCategories')}</span>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              onClick={() => router.push(`/dashboard/items?categoryId=${category.id}`)}
              className="glass-card p-5 rounded-3xl flex flex-col justify-between group hover:border-slate-300 hover:shadow-card-hover transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-lg shrink-0 shadow-xs"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </h3>
                </div>

                {category.userId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCategoryToDelete(category);
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium flex items-center gap-1 group-hover:text-slate-900 transition-colors">
                  <span>{t('categories.totalItems')}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all rtl:rotate-180" />
                </span>
                <span className="font-extrabold text-slate-900 font-mono text-sm bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                  {category.itemCount ?? 0}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('categories.modalTitle')}
        description={t('categories.modalDesc')}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs">{error}</div>}

          <Input
            label={t('categories.categoryNameLabel')}
            placeholder={t('categories.categoryNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              {t('categories.colorTagLabel')}
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-xl transition-all cursor-pointer ${
                    color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110 shadow-sm' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={createMutation.isPending}>
              {t('categories.createCategoryBtn')}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteMutation.mutate(categoryToDelete.id);
          }
        }}
        title={t('categories.deleteCategoryTitle')}
        message={t('categories.deleteCategoryConfirm', { name: categoryToDelete?.name || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
