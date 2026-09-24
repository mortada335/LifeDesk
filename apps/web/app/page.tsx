'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ChevronRight,
  FolderLock,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-200">
              L
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">LifeDesk</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              {t('landing.featuresNav')}
            </a>
            <a href="#preview" className="hover:text-indigo-600 transition-colors">
              {t('landing.howItWorksNav')}
            </a>
            <a href="#security" className="hover:text-indigo-600 transition-colors">
              {t('landing.securityNav')}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <a href="/dashboard">
                <Button size="sm">
                  {t('landing.openDashboard')} <ArrowRight className="w-4 h-4 ms-1.5 rtl:rotate-180" />
                </Button>
              </a>
            ) : (
              <>
                <a href="/login" className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2">
                  {t('landing.signIn')}
                </a>
                <a href="/register">
                  <Button size="sm">
                    {t('landing.startFree')} <ChevronRight className="w-4 h-4 ms-1 rtl:rotate-180" />
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>{t('landing.badge')}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          {t('landing.heroTitlePrefix')} <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600">
            {t('landing.heroTitleSuffix')}
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t('landing.heroSubtitle')}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a href={user ? '/dashboard' : '/register'} className="w-full sm:w-auto">
            <Button size="lg" className="w-full text-sm font-semibold px-7 shadow-indigo-200 shadow-md">
              {user ? t('landing.openDashboard') : t('landing.startFree')}
              <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Button>
          </a>
          <a href="#preview" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full text-sm font-semibold px-6">
              {t('landing.seeHowItWorks')}
            </Button>
          </a>
        </div>

        {/* Live UI Mockup Preview */}
        <div id="preview" className="mt-14 relative mx-auto max-w-4xl text-start">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xl shadow-slate-200/70">
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ms-3 text-xs font-semibold text-slate-400">LifeDesk — {t('common.subTagline')}</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                LIVE DEMO
              </span>
            </div>

            {/* Mockup Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold uppercase text-amber-700">{t('dashboard.statsTodayDue')}</span>
                <p className="text-xl font-bold text-amber-900 mt-0.5">2</p>
              </div>
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-blue-700">{t('dashboard.statsUpcoming')}</span>
                <p className="text-xl font-bold text-blue-900 mt-0.5">7</p>
              </div>
              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100">
                <span className="text-[10px] font-bold uppercase text-rose-700">{t('dashboard.statsOverdue')}</span>
                <p className="text-xl font-bold text-rose-900 mt-0.5">0</p>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-700">{t('items.totalAmount')}</span>
                <p className="text-xl font-bold text-emerald-900 mt-0.5">$185.00</p>
              </div>
            </div>

            {/* Mockup Item Cards */}
            <div className="space-y-2.5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-50 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-900">{t('landing.mockItem1Title')}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="text-amber-600 font-semibold">🔴 {t('dashboard.dueTodayLabel')}</span>
                      <span>•</span>
                      <span className="font-medium text-emerald-700 font-mono">$35.00 USD</span>
                      <span>•</span>
                      <span className="text-purple-600">🔄 {t('common.recurrence.monthly')}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                  {t('common.types.bill')}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded border-2 border-slate-300 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-900">{t('landing.mockItem2Title')}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="text-slate-500">{t('dashboard.daysRemaining', { count: 60 })}</span>
                      <span>•</span>
                      <span className="text-indigo-600">📎 1 PDF</span>
                      <span>•</span>
                      <span className="text-amber-600 font-semibold">{t('landing.mockItem2Sub')}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700">
                  {t('common.types.document')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">{t('landing.featuresTitle')}</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-start">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.featureRecurrenceTitle')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('landing.featureRecurrenceDesc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.featureRadarTitle')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('landing.featureRadarDesc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <FolderLock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{t('landing.featureVaultTitle')}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {t('landing.featureVaultDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('landing.howItWorksNav')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm inline-flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-slate-900 pt-2">{t('landing.featureVaultTitle')}</h3>
            <p className="text-xs text-slate-500">
              {t('landing.featureVaultDesc')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm inline-flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-slate-900 pt-2">{t('landing.featureRadarTitle')}</h3>
            <p className="text-xs text-slate-500">
              {t('landing.featureRadarDesc')}
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm inline-flex items-center justify-center">
              3
            </span>
            <h3 className="text-sm font-bold text-slate-900 pt-2">{t('landing.featureRecurrenceTitle')}</h3>
            <p className="text-xs text-slate-500">
              {t('landing.featureRecurrenceDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* Security note */}
      <section id="security" className="py-12 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center space-y-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <h2 className="text-xl sm:text-2xl font-bold">{t('landing.ctaTitle')}</h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {t('landing.ctaSubtitle')}
          </p>
          <div className="pt-2">
            <a href="/register">
              <Button size="md" className="bg-indigo-500 hover:bg-indigo-600 text-white">
                {t('landing.ctaButton')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-slate-200/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              L
            </div>
            <span className="font-bold text-slate-900">LifeDesk</span>
            <span>— {t('common.subTagline')}</span>
          </div>
          <p>© 2026 LifeDesk. {t('landing.footerRights')}</p>
        </div>
      </footer>
    </div>
  );
}
