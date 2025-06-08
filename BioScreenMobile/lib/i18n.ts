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
    // Force Arabic as default language
    const defaultLanguage = 'ar';
    
    // Clear any existing language preference and set to Arabic
    await AsyncStorage.setItem('healthscreen_language', 'ar');

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
        lng: 'ar', // Force Arabic as the initial language
        interpolation: {
          escapeValue: false
        },
        react: {
          useSuspense: false
        }
      });

    // Force change to Arabic to ensure it's set correctly
    await i18n.changeLanguage('ar');

    // Set RTL to true for Arabic
    const isRTL = true;
    console.log('Setting RTL to:', isRTL);
    
    // Always enable RTL for Arabic
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);

    console.log('Current language:', i18n.language);
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

// Initialize on startup
initI18n();

export default i18n; 
