'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { LifeItemDto, ItemStatus } from '@lifedesk/types';
import {
  Search,
  CheckSquare,
  Calendar,
  FolderKanban,
  History,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { TypeBadge, PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
  onSelectItem?: (item: LifeItemDto) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onOpenCreate,
  onSelectItem,
}: CommandPaletteProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Query matching items with debounce
  const { data: searchResults, isLoading } = useQuery<{ data: LifeItemDto[] }>({
    queryKey: ['command-palette-search', query],
    queryFn: () => apiClient(`/items?search=${encodeURIComponent(query)}&limit=6`),
    enabled: isOpen && query.trim().length > 0,
    staleTime: 1000 * 10,
  });

  const items = searchResults?.data ?? [];

  if (!isOpen) return null;

  const quickNavigations = [
    {
      label: t('nav.overview'),
      href: '/dashboard',
      icon: Sparkles,
      shortcut: 'G D',
    },
    {
      label: t('nav.allCommitments'),
      href: '/dashboard/items',
      icon: CheckSquare,
      shortcut: 'G I',
    },
    {
      label: t('nav.calendar'),
      href: '/dashboard/calendar',
      icon: Calendar,
      shortcut: 'G C',
    },
    {
      label: t('nav.categories'),
      href: '/dashboard/categories',
      icon: FolderKanban,
      shortcut: 'G K',
    },
    {
      label: t('nav.activityLog'),
      href: '/dashboard/activity',
      icon: History,
      shortcut: 'G A',
    },
    {
      label: t('nav.settings'),
      href: '/dashboard/settings',
      icon: Settings,
      shortcut: 'G S',
    },
  ];

  const handleNavigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.searchPlaceholder') || 'Type a commitment, task, or page...'}
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-100 rounded-md text-slate-500 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results / Navigation Body */}
        <div className="overflow-y-auto p-3 space-y-4">
          {/* Quick Action: Create */}
          <div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-50/80 to-violet-50/80 hover:from-indigo-100/80 hover:to-violet-100/80 border border-indigo-100 transition-all text-start group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/30">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {t('nav.addCommitment')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {t('modals.createSubtitle')}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
            </button>
          </div>

          {/* Search Results if Query Present */}
          {query.trim().length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
                {t('nav.allCommitments')} ({items.length})
              </p>
              {isLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>{t('items.loadingItems')}</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {t('items.noItemsFound')}
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onSelectItem) {
                        onSelectItem(item);
                        onClose();
                      } else {
                        router.push(`/dashboard/items?search=${encodeURIComponent(item.title)}`);
                        onClose();
                      }
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100/80 cursor-pointer transition-all border border-transparent hover:border-slate-200/60"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.status === ItemStatus.COMPLETED
                            ? 'bg-emerald-500'
                            : item.isOverdue
                            ? 'bg-rose-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>
                            {new Date(item.dueDate).toLocaleDateString(i18n.language, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {item.category && <span>• {item.category.name}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <TypeBadge type={item.type} />
                      <PriorityBadge priority={item.priority} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Quick Navigation Links */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
              {t('landing.featuresNav')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {quickNavigations.map((nav) => {
                const Icon = nav.icon;
                return (
                  <button
                    key={nav.href}
                    type="button"
                    onClick={() => handleNavigate(nav.href)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 text-start transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                        {nav.label}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors rtl:rotate-180" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Shortcut Helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                ↵
              </kbd>{' '}
              {t('common.selectItem')}
            </span>
            <span>
              <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                ESC
              </kbd>{' '}
              {t('common.close')}
            </span>
          </div>
          <span className="font-semibold text-indigo-600">{t('common.commandHud')}</span>
        </div>
      </div>
    </div>
  );
}
