import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ar',
    lng: 'ar',
    debug: false,
    
    resources: {
      en: {
        translation: enTranslations
      },
      ar: {
        translation: arTranslations
      }
    },

    interpolation: {
      escapeValue: false,
    },

    pluralSeparator: '_',
    contextSeparator: '_',

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'healthscreen_language',
      caches: ['localStorage'],
    },
  });

export default i18n;