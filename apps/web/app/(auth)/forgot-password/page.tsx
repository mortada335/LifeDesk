'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { apiClient } from '@/lib/api-client';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await apiClient<{ message: string; resetToken?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const res = await apiClient<{ success: boolean; message: string }>('/auth/reset-password', {
        method: 'POST',
        body: { token: resetToken, newPassword },
      });
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-6 end-6">
        <LanguageSwitcher />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <a href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs border border-slate-800">
            L
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">LifeDesk</span>
        </a>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('auth.forgotTitle')}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {t('auth.forgotSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100/60 rounded-3xl border border-slate-200/80 sm:px-8">
          {message && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {error}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <Input
                label={t('auth.emailLabel')}
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" className="w-full py-2.5 mt-2" isLoading={isLoading}>
                {t('auth.sendRecoveryEmail')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label={t('auth.resetCodeLabel')}
                placeholder={t('auth.resetCodePlaceholder')}
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />

              <Input
                label={t('settings.newPasswordLabel')}
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full py-2.5 mt-2" isLoading={isLoading}>
                {t('settings.updatePasswordBtn')}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <a href="/login" className="text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t('auth.backToLogin')}
            </a>
            {step === 'reset' && (
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-slate-900 hover:text-slate-700 font-medium underline underline-offset-4"
              >
                {t('auth.requestNewCode')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
