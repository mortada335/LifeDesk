'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
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
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{t('auth.signInTitle')}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {t('auth.signInSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100/60 rounded-3xl border border-slate-200/80 sm:px-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <Input
              label={t('auth.emailLabel')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label={t('auth.passwordLabel')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">{t('auth.secureHint')}</span>
              <a href="/forgot-password" className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-4">
                {t('auth.forgotPassword')}
              </a>
            </div>

            <Button type="submit" className="w-full py-2.5 mt-2" isLoading={isLoading}>
              {t('auth.signInButton')} <ArrowRight className="w-4 h-4 ms-1.5 rtl:rotate-180" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              {t('auth.noAccount')}{' '}
              <a href="/register" className="font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-4">
                {t('auth.createOneNow')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
