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
  Search,
  Zap,
} from 'lucide-react';
import { NotificationBell } from '@/components/ui/notification-bell';
import { CreateItemModal } from '@/components/items/create-item-modal';
import { ItemDetailsModal } from '@/components/items/item-details-modal';
import { CommandPalette } from '@/components/ui/command-palette';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useTranslation } from 'react-i18next';
import { LifeItemDto } from '@lifedesk/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<LifeItemDto | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navGroups = [
    {
      label: t('nav.groupWorkspace'),
      items: [
        { name: t('nav.overview'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('nav.allCommitments'), href: '/dashboard/items', icon: CheckSquare },
        { name: t('nav.calendar'), href: '/dashboard/calendar', icon: Calendar },
      ],
    },
    {
      label: t('nav.groupOrganization'),
      items: [
        { name: t('nav.categories'), href: '/dashboard/categories', icon: FolderKanban },
        { name: t('nav.activityLog'), href: '/dashboard/activity', icon: History },
      ],
    },
    {
      label: t('nav.groupSystem'),
      items: [
        { name: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="h-screen flex bg-slate-50/70 overflow-hidden text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white/90 backdrop-blur-xl border-e border-slate-200/80 p-5 shrink-0 justify-between h-full overflow-y-auto z-20">
        <div className="space-y-6">
          {/* Logo & Workspace Tag */}
          <div className="flex items-center justify-between px-1">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-extrabold text-xl shadow-xs border border-slate-800 group-hover:bg-slate-800 transition-colors duration-200">
                L
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-base flex items-center gap-1.5">
                  LifeDesk
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">PRO</span>
                </span>
                <span className="text-[10px] block text-slate-400 font-medium tracking-wide">
                  {t('common.subTagline')}
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Add CTA */}
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t('nav.addCommitment')}</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/20 rounded text-white/90">
              +
            </kbd>
          </Button>

          {/* Nav Items Grouped */}
          <div className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.label}
                </p>
                <div className="space-y-0.5 pt-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-slate-100/90 text-slate-950 font-bold shadow-2xs border border-slate-200/80'
                            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-2xs">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title={t('nav.logOut')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              aria-label={isMobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick Search trigger HUD */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 text-xs border border-slate-200/60 transition-all cursor-pointer shadow-2xs group"
              title={t('common.searchTooltip')}
            >
              <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{t('common.searchPlaceholder')}</span>
              <kbd className="ms-2 px-1.5 py-0.5 text-[10px] font-mono bg-white rounded shadow-2xs text-slate-600 border border-slate-200 group-hover:border-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('nav.organizedPrepared')}</span>
            </div>

            <ThemeSwitcher />
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="sm:hidden p-2 rounded-xl bg-slate-900 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>

            <NotificationBell />
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 p-4 space-y-2 shrink-0 animate-in fade-in slide-in-from-top-2">
            {navGroups.flatMap((g) => g.items).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-slate-100 text-slate-950 font-bold border border-slate-200' : 'text-slate-600'
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

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl w-full mx-auto pb-12">{children}</div>
        </main>
      </div>

      {/* Global Quick Add Modal */}
      <CreateItemModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Global Command Palette (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenCreate={() => setIsCreateOpen(true)}
        onSelectItem={(item) => setSelectedItemForDetails(item)}
      />

      {/* Quick Details Modal when opened from Command Palette */}
      <ItemDetailsModal
        isOpen={!!selectedItemForDetails}
        item={selectedItemForDetails}
        onClose={() => setSelectedItemForDetails(null)}
      />
    </div>
  );
}
