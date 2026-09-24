'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'pill';
}

export function LanguageSwitcher({ className = '', variant = 'outline' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const toggleLanguage = () => {
    const nextLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };

  const baseStyle =
    'inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none cursor-pointer';

  const variants = {
    outline:
      'px-2.5 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs hover:border-slate-300',
    ghost: 'px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100',
    pill: 'px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700',
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      title={isArabic ? 'Switch to English' : 'التحويل إلى اللغة العربية'}
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
      <span>{isArabic ? 'English' : 'العربية'}</span>
    </button>
  );
}
