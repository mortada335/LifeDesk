'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const updateDocumentAttributes = (lang: string) => {
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
      try {
        localStorage.setItem('lifedesk_lang', lang);
      } catch (e) {}
    };

    // Apply initially
    updateDocumentAttributes(i18n.language || 'en');

    // Listen to subsequent language changes
    const handleLanguageChanged = (lng: string) => {
      updateDocumentAttributes(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
