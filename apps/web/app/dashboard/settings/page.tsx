'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { apiClient } from '@/lib/api-client';
import { User, Lock, CheckCircle2, Globe, Bell, Send, AlertCircle, Shield, LogOut } from 'lucide-react';
import { usePushNotifications } from '@/lib/push-notifications';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [startOfWeek, setStartOfWeek] = useState(user?.startOfWeek || 'monday');
  const [dateFormat, setDateFormat] = useState(user?.dateFormat || 'MM/DD/YYYY');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  // Push notifications state
  const { permission, isSupported, requestPermission, sendTestNotification } = usePushNotifications();

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);
    setProfileLoading(true);

    try {
      const updated = await apiClient<any>('/auth/profile', {
        method: 'PATCH',
        body: { name, timezone, startOfWeek, dateFormat },
      });
      updateUser(updated);
      setProfileMsg(t('settings.profileSuccess'));
    } catch (err: any) {
      setProfileError(err.message || t('common.error'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    setPassError(null);
    setPassLoading(true);

    try {
      const res = await apiClient<{ success: boolean; message: string }>('/auth/change-password', {
        method: 'POST',
        body: { oldPassword, newPassword },
      });
      setPassMsg(res.message);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPassError(err.message || t('common.error'));
    } finally {
      setPassLoading(false);
    }
  };

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>{t('settings.title')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {t('settings.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="glass-card rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-xs">
        {/* Profile & Regional Preferences Form */}
        <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" /> {t('settings.profileSection')}
            </h2>
            {profileMsg && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {profileMsg}
              </span>
            )}
            {profileError && (
              <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> {profileError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('settings.fullNameLabel')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('settings.emailLabel')}
              </label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-400 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <Select
              label={t('settings.languageLabel')}
              value={i18n.language === 'ar' ? 'ar' : 'en'}
              options={[
                { label: 'English (US)', value: 'en' },
                { label: 'العربية (Arabic)', value: 'ar' },
              ]}
              onChange={(e) => handleLanguageChange(e.target.value)}
            />

            <Select
              label={t('settings.timezoneLabel')}
              value={timezone}
              options={[
                { label: 'UTC', value: 'UTC' },
                { label: 'Asia/Baghdad (UTC+3)', value: 'Asia/Baghdad' },
                { label: 'Asia/Riyadh (UTC+3)', value: 'Asia/Riyadh' },
                { label: 'Africa/Cairo (UTC+2)', value: 'Africa/Cairo' },
                { label: 'Asia/Dubai (UTC+4)', value: 'Asia/Dubai' },
                { label: 'Europe/Berlin (CET/CEST)', value: 'Europe/Berlin' },
                { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
                { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
              ]}
              onChange={(e) => setTimezone(e.target.value)}
            />

            <Select
              label={t('settings.startOfWeekLabel')}
              value={startOfWeek}
              options={[
                { label: t('settings.monday'), value: 'monday' },
                { label: t('settings.sunday'), value: 'sunday' },
                { label: t('settings.saturday'), value: 'saturday' },
              ]}
              onChange={(e) => setStartOfWeek(e.target.value)}
            />

            <Select
              label={t('settings.dateFormatLabel')}
              value={dateFormat}
              options={[
                { label: 'MM/DD/YYYY (e.g. 09/20/2026)', value: 'MM/DD/YYYY' },
                { label: 'DD/MM/YYYY (e.g. 20/09/2026)', value: 'DD/MM/YYYY' },
                { label: 'YYYY-MM-DD (e.g. 2026-09-20)', value: 'YYYY-MM-DD' },
              ]}
              onChange={(e) => setDateFormat(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {t('settings.currencyLabel')}
              </label>
              <input
                type="text"
                disabled
                value={t('settings.currencyFixedValue')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-700 text-sm font-bold font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={profileLoading}
            >
              {t('settings.saveChangesBtn')}
            </Button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" /> {t('settings.changePasswordSection')}
            </h2>
            {passMsg && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {passMsg}
              </span>
            )}
            {passError && (
              <span className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full font-semibold animate-in fade-in">
                {passError}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('settings.currentPasswordLabel')}
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />

            <Input
              label={t('settings.newPasswordLabel')}
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="secondary"
              isLoading={passLoading}
            >
              {t('settings.updatePasswordBtn')}
            </Button>
          </div>
        </form>

        {/* Browser Push Notifications */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> {t('settings.pushNotificationsSection')}
              </h2>
              <p className="text-xs text-slate-500 max-w-xl">
                {t('settings.pushNotificationsDesc')}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {permission === 'granted' ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('settings.pushStatusEnabled')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      sendTestNotification(
                        t('settings.testPushTitle'),
                        t('settings.testPushBody'),
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                  >
                    <Send className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span>{t('settings.sendTestPushBtn')}</span>
                  </button>
                </>
              ) : permission === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 max-w-xs text-start">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {t('settings.pushStatusDenied')}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await requestPermission();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('settings.enablePushBtn')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Session & Security */}
        <div className="p-6 sm:p-8 flex items-center justify-between bg-slate-50/40">
          <div>
            <h3 className="text-xs font-bold text-slate-900">{t('settings.signOutSection')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('settings.signOutDesc')}</p>
          </div>

          <Button
            type="button"
            variant="danger"
            onClick={() => setIsLogoutDialogOpen(true)}
          >
            <LogOut className="w-3.5 h-3.5 me-1.5 shrink-0" />
            {t('settings.logOutBtn')}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={logout}
        title={t('settings.signOutSection')}
        message={t('settings.signOutDesc')}
        confirmText={t('settings.logOutBtn')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}
