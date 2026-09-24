'use client';

import { useState, useEffect, useCallback } from 'react';

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): PushPermissionState {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission as PushPermissionState;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    console.warn('Service worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<PushPermissionState> {
  if (!isPushSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission as PushPermissionState;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return getNotificationPermission();
  }
}

export async function showBrowserNotification(
  title: string,
  options?: NotificationOptions & { url?: string },
): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    icon: '/icon.png',
    badge: '/icon.png',
    ...options,
    data: {
      url: options?.url || '/dashboard',
      ...(options?.data || {}),
    },
  };

  // Try service worker first for optimal mobile & desktop integration
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (e) {
      // Fall through to window.Notification
    }
  }

  try {
    const notification = new Notification(title, notificationOptions);
    notification.onclick = () => {
      window.focus();
      if (options?.url && window.location.pathname !== options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };
    return true;
  } catch (err) {
    console.warn('Failed to display native notification:', err);
    return false;
  }
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = isPushSupported();
    setIsSupported(supported);
    if (supported) {
      setPermission(getNotificationPermission());
      // Register service worker in background if already granted
      if (Notification.permission === 'granted') {
        registerServiceWorker();
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const sendTestNotification = useCallback(
    async (title = 'LifeDesk Reminders 🔔', body = 'Push notifications are active! You will be alerted before deadlines.') => {
      return showBrowserNotification(title, {
        body,
        tag: 'lifedesk-test',
        url: '/dashboard',
      });
    },
    [],
  );

  return {
    permission,
    isSupported,
    requestPermission,
    sendTestNotification,
  };
}
