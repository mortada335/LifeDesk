'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, CheckCheck, Clock, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InAppNotificationDto } from '@lifedesk/types';
import { apiClient } from '@/lib/api-client';
import { usePushNotifications, showBrowserNotification } from '@/lib/push-notifications';
import { useTranslation } from 'react-i18next';

import { Button } from './button';

export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { permission, requestPermission } = usePushNotifications();

  const { data: notifications = [], refetch } = useQuery<InAppNotificationDto[]>({
    queryKey: ['notifications'],
    queryFn: () => apiClient<InAppNotificationDto[]>('/notifications'),
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  // Only refetch notifications when navigating to a different page/route
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      refetch();
    }
  }, [pathname, refetch]);

  // When push permission is granted, notify the browser for any new unread notification
  useEffect(() => {
    if (permission !== 'granted' || notifications.length === 0) return;

    const notifiedKey = 'lifedesk_notified_ids';
    let notifiedIds: string[] = [];
    try {
      notifiedIds = JSON.parse(sessionStorage.getItem(notifiedKey) || '[]');
    } catch (e) {}

    const unread = notifications.filter((n) => !n.isRead && !notifiedIds.includes(n.id));
    if (unread.length > 0) {
      unread.forEach((item) => {
        showBrowserNotification(item.title, {
          body: item.message,
          tag: item.id,
          url: '/dashboard',
        });
      });

      const updatedIds = Array.from(new Set([...notifiedIds, ...unread.map((u) => u.id)]));
      try {
        sessionStorage.setItem(notifiedKey, JSON.stringify(updatedIds));
      } catch (e) {}
    }
  }, [notifications, permission]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllMutation = useMutation({
    mutationFn: () => apiClient('/notifications/read-all', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
        aria-label={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 end-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/90 py-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-5 pb-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{t('notifications.title')}</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 rounded-full border border-slate-200 font-mono">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllMutation.mutate()}
                className="text-xs text-slate-900 hover:text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 shrink-0" /> {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {permission === 'default' && (
            <div className="mx-4 my-2.5 p-3 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-900 font-semibold text-[11px] leading-tight">
                {t('settings.pushPromptBanner')}
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={async () => {
                  await requestPermission();
                }}
              >
                {t('settings.enableBtn')}
              </Button>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                {t('notifications.noNotifications')}
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markOneMutation.mutate(n.id)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 text-start ${
                    !n.isRead ? 'bg-slate-100/60' : ''
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'OVERDUE' ? (
                      <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${!n.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleDateString(i18n.language, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 self-center shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
