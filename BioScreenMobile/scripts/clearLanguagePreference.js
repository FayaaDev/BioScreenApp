import AsyncStorage from '@react-native-async-storage/async-storage';

// Clear language preference to allow fresh start with Arabic
const clearLanguagePreference = async () => {
  try {
    await AsyncStorage.removeItem('healthscreen_language');
    console.log('Language preference cleared');
  } catch (error) {
    console.error('Error clearing language preference:', error);
  }
};

clearLanguagePreference();
