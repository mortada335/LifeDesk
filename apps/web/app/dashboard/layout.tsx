'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  FolderKanban,
  History,
  Settings,
  Plus,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { CreateItemModal } from '@/components/items/create-item-modal';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading LifeDesk...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { name: t('nav.overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('nav.allCommitments'), href: '/dashboard/items', icon: CheckSquare },
    { name: t('nav.calendar'), href: '/dashboard/calendar', icon: Calendar },
    { name: t('nav.categories'), href: '/dashboard/categories', icon: FolderKanban },
    { name: t('nav.activityLog'), href: '/dashboard/activity', icon: History },
    { name: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-e border-slate-200/80 p-5 shrink-0 justify-between h-full overflow-y-auto">
        <div>
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1 mb-6">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-indigo-200 shadow-md">
              L
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">LifeDesk</span>
              <span className="text-[10px] block text-indigo-600 font-semibold uppercase tracking-wider">{t('common.subTagline')}</span>
            </div>
          </Link>

          {/* Quick Add Button */}
          <Button
            type="button"
            className="w-full mb-6 py-2.5 font-medium shadow-indigo-100"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4 me-1.5 shrink-0" /> {t('nav.addCommitment')}
          </Button>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
              title={t('nav.logOut')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>{t('nav.organizedPrepared')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button
              type="button"
              size="sm"
              className="sm:hidden"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <NotificationBell />
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 shrink-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut className="w-4 h-4 shrink-0" /> {t('nav.logOut')}
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl w-full mx-auto pb-10">{children}</div>
        </main>
      </div>

      {/* Global Quick Add Modal */}
      <CreateItemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
