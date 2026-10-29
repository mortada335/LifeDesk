'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose();
        }}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity flex items-center justify-center p-4 sm:p-6"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs ${
                  variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                    : variant === 'warning'
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                {variant === 'danger' ? (
                  <Trash2 className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                ESC
              </span>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {message}
            </p>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isLoading}
              onClick={onClose}
            >
              {cancelText || t('common.cancel')}
            </Button>

            <Button
              type="button"
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="md"
              isLoading={isLoading}
              onClick={onConfirm}
            >
              {confirmText || t('common.delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
