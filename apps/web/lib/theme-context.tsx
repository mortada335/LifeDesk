'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'nordic' | 'forest' | 'obsidian';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  nameAr: string;
  description: string;
  primaryColor: string;
  bgColor: string;
  accentColor: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'nordic',
    name: 'Nordic Frost',
    nameAr: 'أزرق نورديك',
    description: 'Crisp porcelain, cobalt sapphire, and cool slate',
    primaryColor: '#0f172a',
    bgColor: '#f8fafc',
    accentColor: '#2563eb',
  },
  {
    id: 'forest',
    name: 'Forest & Linen',
    nameAr: 'كتان وزمرّد',
    description: 'Warm editorial cream, British racing green, and bronze',
    primaryColor: '#154530',
    bgColor: '#f5f4ed',
    accentColor: '#16a34a',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Amber',
    nameAr: 'عنبر داكن',
    description: 'Deep carbon midnight, sunset gold, and amber',
    primaryColor: '#f59e0b',
    bgColor: '#090d14',
    accentColor: '#fbbf24',
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  currentConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>('nordic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifedesk_theme') as AppTheme;
      if (saved && (saved === 'nordic' || saved === 'forest' || saved === 'obsidian')) {
        setThemeState(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else {
        document.documentElement.setAttribute('data-theme', 'nordic');
      }
    } catch {
      document.documentElement.setAttribute('data-theme', 'nordic');
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('lifedesk_theme', newTheme);
    } catch {}
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleTheme = () => {
    const sequence: AppTheme[] = ['nordic', 'forest', 'obsidian'];
    const nextIdx = (sequence.indexOf(theme) + 1) % sequence.length;
    setTheme(sequence[nextIdx]);
  };

  const currentConfig = AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, currentConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

