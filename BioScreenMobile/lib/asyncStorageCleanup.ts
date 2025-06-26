import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Clean up potentially corrupted AsyncStorage data
 * This helps prevent crashes caused by invalid stored data
 */
export const cleanupAsyncStorage = async () => {
  try {
    console.log('Starting AsyncStorage cleanup...');
    
    // List of keys that might contain problematic data
    const keysToValidate = [
      'selectedPersonId',
      'healthscreen_language',
      'healthscreen_user_id'
    ];
    
    for (const key of keysToValidate) {
      try {
        const value = await AsyncStorage.getItem(key);
        
        // Validate selectedPersonId
        if (key === 'selectedPersonId' && value) {
          if (value !== 'user' && isNaN(parseInt(value))) {
            console.log(`Invalid ${key} found: ${value}, resetting to 'user'`);
            await AsyncStorage.setItem(key, 'user');
          }
        }
        
        // Validate language
        if (key === 'healthscreen_language' && value && value !== 'ar' && value !== 'en') {
          console.log(`Invalid ${key} found: ${value}, resetting to 'ar'`);
          await AsyncStorage.setItem(key, 'ar');
        }
        
        // Validate user ID
        if (key === 'healthscreen_user_id' && value && isNaN(parseInt(value))) {
          console.log(`Invalid ${key} found: ${value}, removing`);
          await AsyncStorage.removeItem(key);
        }
        
      } catch (itemError) {
        console.warn(`Error validating ${key}:`, itemError);
        // If there's an error reading/writing a specific key, try to remove it
        try {
          await AsyncStorage.removeItem(key);
        } catch (removeError) {
          console.warn(`Failed to remove problematic key ${key}:`, removeError);
        }
      }
    }
    
    console.log('AsyncStorage cleanup completed');
  } catch (error) {
    console.error('AsyncStorage cleanup failed:', error);
  }
};
