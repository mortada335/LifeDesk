'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CategoryDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Trash2 } from 'lucide-react';
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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('categories.title')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('categories.subtitle')}
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 me-1.5 shrink-0" /> {t('categories.newCategory')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400">
            {t('categories.loadingCategories')}
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-lg shrink-0 shadow-2xs"
                    style={{ backgroundColor: category.color }}
                  />
                  <h3 className="font-semibold text-sm text-slate-900">{category.name}</h3>
                </div>

                {category.userId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(t('categories.deleteCategoryConfirm', { name: category.name }))) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{t('categories.totalItems')}</span>
                <span className="font-bold text-slate-900">{category.itemCount ?? 0}</span>
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
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              {t('categories.createCategoryBtn')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
