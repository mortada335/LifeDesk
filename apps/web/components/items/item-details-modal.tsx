'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LifeItemDto, ItemStatus, ItemType, Priority, AttachmentDto } from '@lifedesk/types';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PriorityBadge, StatusBadge, TypeBadge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { apiClient } from '@/lib/api-client';
import confetti from 'canvas-confetti';
import {
  Calendar,
  DollarSign,
  RefreshCw,
  Trash2,
  CheckCircle,
  ShieldAlert,
  Edit2,
  XCircle,
  Save,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ItemDetailsModalProps {
  item: LifeItemDto | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated?: (updated: LifeItemDto) => void;
}

export function ItemDetailsModal({ item, isOpen, onClose, onItemUpdated }: ItemDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>(Priority.MEDIUM);
  const [editDocNumber, setEditDocNumber] = useState('');
  const [editIssuer, setEditIssuer] = useState('');
  const [editStatus, setEditStatus] = useState<ItemStatus>(ItemStatus.PENDING);

  // When item changes or edit mode enters, populate form
  React.useEffect(() => {
    if (item) {
      setEditTitle(item.title || '');
      setEditDesc(item.description || '');
      setEditAmount(item.amount !== null && item.amount !== undefined ? String(item.amount) : '');
      setEditDueDate(item.dueDate ? item.dueDate.split('T')[0] : '');
      setEditPriority(item.priority || Priority.MEDIUM);
      setEditDocNumber(item.documentNumber || '');
      setEditIssuer(item.issuingAuthority || '');
      setEditStatus(item.status || ItemStatus.PENDING);
      setIsEditing(false);
    }
  }, [item, isOpen]);

  const completeMutation = useMutation({
    mutationFn: () => apiClient(`/items/${item?.id}/complete`, { method: 'POST' }),
    onSuccess: (data: any) => {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      if (onItemUpdated && data.completedItem) onItemUpdated(data.completedItem);
      onClose();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiClient(`/items/${item?.id}`, {
        method: 'PATCH',
        body: { status: ItemStatus.CANCELLED },
      }),
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      if (onItemUpdated) onItemUpdated(updated);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        title: editTitle,
        description: editDesc || undefined,
        dueDate: editDueDate ? new Date(`${editDueDate}T12:00:00`).toISOString() : undefined,
        priority: editPriority,
        status: editStatus,
      };
      if (editAmount !== '') payload.amount = Number(editAmount);
      if (editDocNumber) payload.documentNumber = editDocNumber;
      if (editIssuer) payload.issuingAuthority = editIssuer;

      return apiClient(`/items/${item?.id}`, {
        method: 'PATCH',
        body: payload,
      });
    },
    onSuccess: (updated: any) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      if (onItemUpdated) onItemUpdated(updated);
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiClient(`/items/${item?.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      onClose();
    },
  });

  if (!item) return null;

  const handleAttachmentUploaded = (newAtt: AttachmentDto) => {
    const updatedAttachments = [...(item.attachments || []), newAtt];
    const updated = { ...item, attachments: updatedAttachments };
    queryClient.invalidateQueries({ queryKey: ['items'] });
    if (onItemUpdated) onItemUpdated(updated);
  };

  const handleAttachmentDeleted = (deletedId: string) => {
    const updatedAttachments = (item.attachments || []).filter((a) => a.id !== deletedId);
    const updated = { ...item, attachments: updatedAttachments };
    queryClient.invalidateQueries({ queryKey: ['items'] });
    if (onItemUpdated) onItemUpdated(updated);
  };

  const isCompleted = item.status === ItemStatus.COMPLETED;
  const isCancelled = item.status === ItemStatus.CANCELLED;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('common.edit') : item.title}
      description={`${t('activity.actions.created')} ${new Date(item.createdAt).toLocaleDateString(i18n.language)}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {!isEditing ? (
          <>
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge type={item.type} />
                <PriorityBadge priority={item.priority} />
                <StatusBadge status={item.status} />
                {item.category && (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${item.category.color}15`, color: item.category.color }}
                  >
                    📁 {item.category.name}
                  </span>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3.5 h-3.5 me-1 shrink-0" /> {t('common.edit')}
              </Button>
            </div>

            {/* Due Date & Recurrence Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="font-semibold">{t('common.dueDate')}</p>
                  <p className="text-slate-500">
                    {new Date(item.dueDate).toLocaleDateString(i18n.language, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {item.hasSpecificTime &&
                      ` ${new Date(item.dueDate).toLocaleTimeString(i18n.language, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <RefreshCw className="w-4 h-4 text-purple-500 shrink-0" />
                <div>
                  <p className="font-semibold">{t('modals.recurrenceLabel')}</p>
                  <p className="text-slate-500">
                    {item.recurrence === 'NONE'
                      ? t('common.recurrence.none')
                      : t('items.repeatingBadge', {
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
                </div>
              </div>
            </div>

            {/* Financial Amount */}
            {item.amount !== null && item.amount !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('common.amount')}: ${Number(item.amount).toFixed(2)} USD</span>
              </div>
            )}

            {/* Document Metadata */}
            {item.type === ItemType.DOCUMENT && (item.documentNumber || item.issuingAuthority) && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t('modals.officialDocInfo')}</span>
                </div>
                {item.documentNumber && (
                  <p className="text-amber-800">
                    <span className="font-medium text-amber-950">{t('modals.docNumberLabel')}:</span> {item.documentNumber}
                  </p>
                )}
                {item.issuingAuthority && (
                  <p className="text-amber-800">
                    <span className="font-medium text-amber-950">{t('modals.issuingAuthorityLabel')}:</span>{' '}
                    {item.issuingAuthority}
                  </p>
                )}
              </div>
            )}

            {/* Description / Notes */}
            {item.description && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {t('common.notes')}
                </h4>
                <p className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                  {item.description}
                </p>
              </div>
            )}

            {/* File Attachments Section */}
            <div className="pt-2 border-t border-slate-100">
              <FileUpload
                itemId={item.id}
                attachments={item.attachments}
                onUploadSuccess={handleAttachmentUploaded}
                onDeleteSuccess={handleAttachmentDeleted}
              />
            </div>
          </>
        ) : (
          /* Edit Mode Form */
          <div className="space-y-4">
            <Input
              label={t('common.title')}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('common.dueDate')}
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                required
              />

              <Select
                label={t('common.priority')}
                value={editPriority}
                options={[
                  { label: `🔴 ${t('common.priorities.high')}`, value: Priority.HIGH },
                  { label: `🟡 ${t('common.priorities.medium')}`, value: Priority.MEDIUM },
                  { label: `🟢 ${t('common.priorities.low')}`, value: Priority.LOW },
                ]}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
              />
            </div>

            {(item.type === ItemType.BILL || item.type === ItemType.SUBSCRIPTION) && (
              <Input
                label={t('modals.amountLabel')}
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
            )}

            {item.type === ItemType.DOCUMENT && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={t('modals.docNumberLabel')}
                  value={editDocNumber}
                  onChange={(e) => setEditDocNumber(e.target.value)}
                />
                <Input
                  label={t('modals.issuingAuthorityLabel')}
                  value={editIssuer}
                  onChange={(e) => setEditIssuer(e.target.value)}
                />
              </div>
            )}

            <Select
              label={t('common.status')}
              value={editStatus}
              options={[
                { label: t('common.statuses.pending'), value: ItemStatus.PENDING },
                { label: t('common.statuses.completed'), value: ItemStatus.COMPLETED },
                { label: t('common.statuses.cancelled'), value: ItemStatus.CANCELLED },
              ]}
              onChange={(e) => setEditStatus(e.target.value as ItemStatus)}
            />

            <Textarea
              label={t('common.notes')}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setIsEditing(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => updateMutation.mutate()}
                isLoading={updateMutation.isPending}
              >
                <Save className="w-4 h-4 me-1.5 shrink-0" /> {t('common.saveChanges')}
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        {!isEditing && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="danger"
              size="md"
              onClick={() => setIsDeleteDialogOpen(true)}
              isLoading={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 me-1.5 shrink-0" /> {t('common.delete')}
            </Button>

            <div className="flex items-center gap-2.5">
              {!isCancelled && !isCompleted && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => cancelMutation.mutate()}
                  isLoading={cancelMutation.isPending}
                  title={t('modals.cancelItemBtn')}
                >
                  <XCircle className="w-4 h-4 me-1.5 text-slate-400 shrink-0" /> {t('modals.cancelItemBtn')}
                </Button>
              )}

              {!isCompleted && (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => completeMutation.mutate()}
                  isLoading={completeMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 me-1.5 shrink-0" /> {t('modals.markAsCompleted')}
                </Button>
              )}

              <Button type="button" variant="secondary" size="md" onClick={onClose}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title={t('items.deleteConfirmTitle')}
        message={t('items.deleteItemConfirm', { title: item.title })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </Modal>
  );
}
