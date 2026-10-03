'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ItemType, Priority, Recurrence, CategoryDto } from '@lifedesk/types';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Paperclip, UploadCloud, X, Check, Bell, Calendar, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ItemType;
  defaultDueDate?: string;
}

interface FormValues {
  title: string;
  description?: string;
  type: ItemType;
  priority: Priority;
  categoryId?: string;
  dueDate: string;
  dueTime?: string;
  amount?: number;
  documentNumber?: string;
  issuingAuthority?: string;
  recurrence: Recurrence;
  reminder1Day: boolean;
  reminder3Days: boolean;
  reminder7Days: boolean;
  reminder30Days: boolean;
}

export function CreateItemModal({
  isOpen,
  onClose,
  defaultType = ItemType.TASK,
  defaultDueDate,
}: CreateItemModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useQuery<CategoryDto[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient<CategoryDto[]>('/categories'),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      type: defaultType,
      priority: Priority.MEDIUM,
      dueDate: defaultDueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recurrence: Recurrence.NONE,
      reminder1Day: true,
      reminder3Days: true,
      reminder7Days: false,
      reminder30Days: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        type: defaultType,
        priority: Priority.MEDIUM,
        dueDate: defaultDueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        recurrence: Recurrence.NONE,
        reminder1Day: true,
        reminder3Days: true,
        reminder7Days: false,
        reminder30Days: false,
      });
      setSelectedFile(null);
      setServerError(null);
    }
  }, [isOpen, defaultType, defaultDueDate, reset]);

  const selectedType = watch('type');
  const selectedPriority = watch('priority');

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const created = await apiClient<any>('/items', {
        method: 'POST',
        body: payload,
      });

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        await apiClient(`/items/${created.id}/attachments`, {
          method: 'POST',
          body: formData,
        });
      }

      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      reset();
      setSelectedFile(null);
      onClose();
    },
    onError: (err: any) => {
      setServerError(err.message || t('common.error'));
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);

    // Build reminders array
    const reminderDaysBefore: number[] = [];
    if (values.reminder1Day) reminderDaysBefore.push(1);
    if (values.reminder3Days) reminderDaysBefore.push(3);
    if (values.reminder7Days) reminderDaysBefore.push(7);
    if (values.reminder30Days) reminderDaysBefore.push(30);

    const fullDueDate = values.dueTime
      ? `${values.dueDate}T${values.dueTime}:00`
      : `${values.dueDate}T12:00:00`;

    const payload: any = {
      title: values.title,
      description: values.description || undefined,
      type: values.type,
      priority: values.priority,
      categoryId: values.categoryId || undefined,
      dueDate: new Date(fullDueDate).toISOString(),
      hasSpecificTime: Boolean(values.dueTime),
      recurrence: values.recurrence,
      reminderDaysBefore,
    };

    if (values.amount !== undefined && !isNaN(Number(values.amount))) {
      payload.amount = Number(values.amount);
    }
    if (values.documentNumber) payload.documentNumber = values.documentNumber;
    if (values.issuingAuthority) payload.issuingAuthority = values.issuingAuthority;

    createMutation.mutate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('modals.createTitle')}
      description={t('modals.createSubtitle')}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium animate-in fade-in">
            {serverError}
          </div>
        )}

        {/* Title */}
        <Input
          label={t('modals.itemTitleLabel')}
          placeholder={t('modals.itemTitlePlaceholder')}
          error={errors.title?.message}
          {...register('title', { required: t('modals.itemTitleLabel') })}
        />

        {/* Type & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('modals.typeLabel')}
            options={[
              { label: `💳 ${t('common.types.bill')}`, value: ItemType.BILL },
              { label: `🔄 ${t('common.types.subscription')}`, value: ItemType.SUBSCRIPTION },
              { label: `📄 ${t('common.types.document')}`, value: ItemType.DOCUMENT },
              { label: `🩺 ${t('common.types.appointment')}`, value: ItemType.APPOINTMENT },
              { label: `📋 ${t('common.types.task')}`, value: ItemType.TASK },
              { label: `📌 ${t('common.types.other')}`, value: ItemType.OTHER },
            ]}
            {...register('type')}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('modals.priorityLabel')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setValue('priority', Priority.LOW)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedPriority === Priority.LOW
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('common.priorities.low')}
              </button>
              <button
                type="button"
                onClick={() => setValue('priority', Priority.MEDIUM)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedPriority === Priority.MEDIUM
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('common.priorities.medium')}
              </button>
              <button
                type="button"
                onClick={() => setValue('priority', Priority.HIGH)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedPriority === Priority.HIGH
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('common.priorities.high')}
              </button>
            </div>
          </div>
        </div>

        {/* Category */}
        <Select
          label={t('modals.categoryLabel')}
          options={[
            { label: t('modals.noCategory'), value: '' },
            ...categories.map((c) => ({ label: c.name, value: c.id })),
          ]}
          {...register('categoryId')}
        />

        {/* Due Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('modals.dueDateLabel')}
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate', { required: t('modals.dueDateLabel') })}
          />

          <Input
            label={t('modals.dueTimeLabel')}
            type="time"
            {...register('dueTime')}
          />
        </div>

        {/* Dynamic Fields for Bills & Subscriptions */}
        {(selectedType === ItemType.BILL || selectedType === ItemType.SUBSCRIPTION) && (
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3 animate-in fade-in">
            <Input
              label={t('modals.amountLabel')}
              type="number"
              step="0.01"
              placeholder={t('modals.amountPlaceholder')}
              {...register('amount', { valueAsNumber: true })}
            />
          </div>
        )}

        {/* Dynamic Fields for Documents */}
        {selectedType === ItemType.DOCUMENT && (
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
            <Input
              label={t('modals.docNumberLabel')}
              placeholder="e.g. A12345678"
              {...register('documentNumber')}
            />
            <Input
              label={t('modals.issuingAuthorityLabel')}
              placeholder="e.g. Passport Office"
              {...register('issuingAuthority')}
            />
          </div>
        )}

        {/* Recurrence */}
        <Select
          label={t('modals.recurrenceLabel')}
          options={[
            { label: t('common.recurrence.none'), value: Recurrence.NONE },
            { label: t('common.recurrence.daily'), value: Recurrence.DAILY },
            { label: t('common.recurrence.weekly'), value: Recurrence.WEEKLY },
            { label: t('common.recurrence.monthly'), value: Recurrence.MONTHLY },
            { label: t('common.recurrence.yearly'), value: Recurrence.YEARLY },
          ]}
          {...register('recurrence')}
        />

        {/* Reminders Checkboxes styled as toggle pills */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('modals.reminderLabel')}</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                {...register('reminder1Day')}
              />
              <span className="font-medium text-slate-700">{t('dashboard.daysRemaining', { count: 1 })}</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                {...register('reminder3Days')}
              />
              <span className="font-medium text-slate-700">{t('dashboard.daysRemaining_plural', { count: 3 })}</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                {...register('reminder7Days')}
              />
              <span className="font-medium text-slate-700">{t('dashboard.daysRemaining_plural', { count: 7 })}</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                {...register('reminder30Days')}
              />
              <span className="font-medium text-slate-700">{t('dashboard.daysRemaining_plural', { count: 30 })}</span>
            </label>
          </div>
        </div>

        {/* Description */}
        <Textarea
          label={t('modals.notesLabel')}
          placeholder={t('modals.notesPlaceholder')}
          {...register('description')}
        />

        {/* Optional Attachment File */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {t('modals.attachmentsSection')} ({selectedFile ? 1 : 0})
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  setServerError(t('modals.fileTooLarge'));
                  return;
                }
                setSelectedFile(file);
                setServerError(null);
              }
            }}
          />

          {selectedFile ? (
            <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate font-semibold text-slate-900">{selectedFile.name}</span>
                <span className="text-slate-400 shrink-0 font-mono text-[10px]">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title={t('common.delete')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-indigo-500" />
              <span>{t('modals.uploadZonePrompt')}</span>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            {t('modals.createSubmitBtn')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
