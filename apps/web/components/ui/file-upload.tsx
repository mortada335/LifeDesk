'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, ExternalLink } from 'lucide-react';
import { AttachmentDto } from '@lifedesk/types';
import { apiClient, API_BASE_URL } from '@/lib/api-client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
  itemId: string;
  attachments?: AttachmentDto[];
  onUploadSuccess: (newAttachment: AttachmentDto) => void;
  onDeleteSuccess: (attachmentId: string) => void;
}

export function FileUpload({
  itemId,
  attachments = [],
  onUploadSuccess,
  onDeleteSuccess,
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<AttachmentDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError(t('modals.fileTooLarge'));
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploaded = await apiClient<AttachmentDto>(`/items/${itemId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      onUploadSuccess(uploaded);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!attachmentToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient(`/items/${itemId}/attachments/${attachmentToDelete.id}`, {
        method: 'DELETE',
      });
      onDeleteSuccess(attachmentToDelete.id);
      setAttachmentToDelete(null);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          {t('modals.attachmentsSection')} ({attachments.length})
        </label>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-100/60 rounded-2xl p-5 text-center cursor-pointer transition-all duration-200 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-slate-800">
          {isUploading ? t('modals.uploadingFile') : t('modals.uploadZonePrompt')}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">{t('modals.uploadZoneHint')}</p>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Existing attachments list */}
      {attachments.length > 0 && (
        <div className="space-y-2 mt-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl text-xs shadow-2xs hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden me-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="truncate font-semibold text-slate-800" title={att.fileName}>
                  {att.fileName}
                </span>
                <span className="text-slate-400 font-mono text-[10px] shrink-0">
                  ({formatFileSize(att.fileSize)})
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`${API_BASE_URL.replace(/\/api\/?$/, '')}${att.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title={t('modals.viewFile')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setAttachmentToDelete(att)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Deletion Confirmation */}
      <ConfirmDialog
        isOpen={!!attachmentToDelete}
        onClose={() => setAttachmentToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('modals.deleteAttachmentTitle')}
        message={t('modals.deleteAttachmentConfirm', { name: attachmentToDelete?.fileName || '' })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
