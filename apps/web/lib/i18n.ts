'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from '../locales/en';
import { ar } from '../locales/ar';

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lifedesk_lang');
    if (saved === 'ar' || saved === 'en') return saved;
  }
  return 'en';
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: typeof window !== 'undefined' ? getInitialLanguage() : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already handles xss
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;
