import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
// import { cleanupAsyncStorage } from './asyncStorageCleanup';

// Import translations
import enTranslations from '../i18n/locales/en.json';
import arTranslations from '../i18n/locales/ar.json';
import { getStoredLanguage, setStoredLanguage, Language } from './languageManager';

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
        lng: 'ar', // Default to Arabic, will be updated from storage if available
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });

    // Listen for language changes and persist to AsyncStorage
    i18n.on('languageChanged', (lng: string) => {
      if (lng === 'ar' || lng === 'en') {
        setStoredLanguage(lng as Language);
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

/**
 * Load language preference from AsyncStorage and apply it to i18n
 * This should be called early in the app lifecycle (e.g., in _layout.tsx)
 */
export async function loadStoredLanguage(): Promise<void> {
  try {
    const storedLang = await getStoredLanguage();
    if (storedLang && storedLang !== i18n.language) {
      await i18n.changeLanguage(storedLang);
      console.log(`Language loaded from storage: ${storedLang}`);
    }
  } catch (error) {
    console.error('Error loading stored language:', error);
  }
}

export default i18n; 
