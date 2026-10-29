'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, AVAILABLE_THEMES, AppTheme } from '@/lib/theme-context';
import { useTranslation } from 'react-i18next';
import { Palette, Check, Sparkles } from 'lucide-react';

interface ThemeSwitcherProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'dropdown';
}

export function ThemeSwitcher({ className = '', variant = 'pill' }: ThemeSwitcherProps) {
  const { theme, setTheme, toggleTheme, currentConfig } = useTheme();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-2xs group"
        title={isArabic ? 'تغيير ألوان المظهر' : 'Change Color Theme'}
        aria-label="Change color theme"
      >
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: currentConfig.accentColor }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: currentConfig.bgColor }}
          />
        </span>
        <span className="hidden sm:inline font-medium text-[11px]">
          {isArabic ? currentConfig.nameAr : currentConfig.name}
        </span>
        <Palette className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
      </button>

      {/* Popover Menu with Color Palettes */}
      {isOpen && (
        <div
          className={`absolute ${
            isArabic ? 'start-0' : 'end-0'
          } mt-2 w-56 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1`}
        >
          <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-slate-500" />
              {isArabic ? 'ألوان الواجهة' : 'UI Color Themes'}
            </span>
            <span className="text-[9px] font-mono text-slate-400">3 {isArabic ? 'سمات' : 'Modes'}</span>
          </div>

          <div className="space-y-1 pt-1">
            {AVAILABLE_THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all text-start cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 font-bold text-slate-900 border border-slate-200/80 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Color Swatch Dual-Dot */}
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0 flex items-center justify-center shadow-2xs"
                      style={{ backgroundColor: t.bgColor }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.accentColor }}
                      />
                    </span>
                    <div>
                      <p className="text-xs font-semibold leading-tight">
                        {isArabic ? t.nameAr : t.name}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {t.id === 'nordic'
                          ? isArabic ? 'أزرق بارد ناصع' : 'Porcelain & Cobalt'
                          : t.id === 'forest'
                          ? isArabic ? 'ورق كتان وزمرّد' : 'Linen Paper & Emerald'
                          : isArabic ? 'كربون داكن وذهب' : 'Carbon Black & Gold'}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 shrink-0 ms-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

