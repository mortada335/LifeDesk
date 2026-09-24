'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, ExternalLink } from 'lucide-react';
import { AttachmentDto } from '@lifedesk/types';
import { apiClient, API_BASE_URL } from '@/lib/api-client';
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

  const handleDelete = async (attachmentId: string) => {
    try {
      await apiClient(`/items/${itemId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      onDeleteSuccess(attachmentId);
    } catch (err: any) {
      setError(err.message || t('common.error'));
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
        className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/30 rounded-xl p-4 text-center cursor-pointer transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <UploadCloud className="w-6 h-6 mx-auto text-indigo-500 mb-1.5" />
        <p className="text-xs font-medium text-slate-700">
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
              className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2 overflow-hidden me-2">
                <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="truncate font-medium text-slate-800" title={att.fileName}>
                  {att.fileName}
                </span>
                <span className="text-slate-400 shrink-0">({formatFileSize(att.fileSize)})</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`${API_BASE_URL.replace(/\/api\/?$/, '')}${att.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors"
                  title={t('modals.viewFile')}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(att.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
