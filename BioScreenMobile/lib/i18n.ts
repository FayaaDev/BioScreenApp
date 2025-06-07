import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Import translations
import enTranslations from '../i18n/locales/en.json';
import arTranslations from '../i18n/locales/ar.json';

// Initialize i18n
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
    lng: 'ar', // default language
    interpolation: {
      escapeValue: false
    }
  });

// Load saved language preference
const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('healthscreen_language');
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
      const isRTL = savedLanguage === 'ar';
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.swapLeftAndRightInRTL(isRTL);
      }
    }
  } catch (error) {
    console.error('Error loading language preference:', error);
  }
};

// Load saved language on app start
loadSavedLanguage();

export default i18n; 
