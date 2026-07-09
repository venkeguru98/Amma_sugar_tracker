import i18n from 'i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from '../locales/en/common.json';
import commonTa from '../locales/ta/common.json';

const resources = {
  en: {
    common: commonEn
  },
  ta: {
    common: commonTa
  }
};

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    parseMissingKeyHandler: (key) => {
      console.warn(`[i18n] Missing translation key: "${key}"`);
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1] || key;
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/_/g, ' ');
    }
  });

export default i18next;
