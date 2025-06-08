import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Import translations
import enTranslations from '../i18n/locales/en.json';
import arTranslations from '../i18n/locales/ar.json';

// Initialize i18n with async configuration
const initI18n = async () => {
  try {
    // Check for saved language preference, default to Arabic
    const savedLanguage = await AsyncStorage.getItem('healthscreen_language');
    const defaultLanguage = savedLanguage || 'ar';

    await i18n
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
        lng: defaultLanguage,
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });

    // Set RTL based on language
    const isRTL = defaultLanguage === 'ar';
    console.log('Setting RTL to:', isRTL);
    
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(true);
      if (isRTL) {
        I18nManager.forceRTL(true);
      } else {
        I18nManager.forceRTL(false);
      }
    }

    console.log('Current language:', i18n.language);
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

// Initialize on startup
initI18n();

export default i18n; 
