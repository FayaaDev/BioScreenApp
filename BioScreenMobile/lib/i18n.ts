import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
// import { cleanupAsyncStorage } from './asyncStorageCleanup';

// Import translations
import enTranslations from '../i18n/locales/en.json';
import arTranslations from '../i18n/locales/ar.json';

// Initialize i18n with simpler synchronous configuration
const initI18n = () => {
  try {
    i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: {
            translation: enTranslations
          },
          ar: {
            translation: arTranslations
          }
        },
        fallbackLng: 'ar',
        lng: 'ar', // Force Arabic as the initial language
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });

    // RTL is now handled by rtlSetup.ts - don't set it here to avoid conflicts
    console.log('i18n initialized with language:', i18n.language);
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

// Initialize on startup
initI18n();

export default i18n; 
