import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'healthscreen_language';

export type Language = 'ar' | 'en';

/**
 * Get the stored language preference from AsyncStorage
 * @returns Promise resolving to 'ar' or 'en', defaults to 'ar' if not found
 */
export async function getStoredLanguage(): Promise<Language> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') {
      return stored as Language;
    }
    // Default to Arabic if invalid or missing
    return 'ar';
  } catch (error) {
    console.error('Error reading language preference:', error);
    return 'ar';
  }
}

/**
 * Save language preference to AsyncStorage
 * @param lang Language code ('ar' or 'en')
 */
export async function setStoredLanguage(lang: Language): Promise<void> {
  try {
    if (lang !== 'ar' && lang !== 'en') {
      console.warn(`Invalid language code: ${lang}, defaulting to 'ar'`);
      lang = 'ar';
    }
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    console.log(`Language preference saved: ${lang}`);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
}

