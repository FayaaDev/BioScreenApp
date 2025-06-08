import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, I18nManager, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    const isRTL = newLang === 'ar';

    try {
      console.log('Switching language from', i18n.language, 'to', newLang);
      
      // Save language preference first
      await AsyncStorage.setItem('healthscreen_language', newLang);
      
      // Update i18n language
      await i18n.changeLanguage(newLang);

      // Update RTL settings - always reload to ensure proper layout
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.forceRTL(isRTL);
        if (Updates?.reloadAsync) {
          // Reload the app to apply RTL changes
          console.log('Reloading app for RTL change');
          await Updates.reloadAsync();
        } else {
          Alert.alert(
            'Language Changed',
            'Please restart the app to apply the language direction change.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // Force a small delay to ensure language change is applied
        setTimeout(() => {
          console.log('Language switched successfully without RTL change');
        }, 100);
      }
    } catch (error) {
      console.error('Error switching language:', error);
      Alert.alert(
        'Error',
        'Failed to switch language. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: i18n.language === 'ar' ? '#008553' : '#f0fdf4' }]} 
        onPress={toggleLanguage}
      >
        <Text style={[styles.buttonText, { color: i18n.language === 'ar' ? '#ffffff' : '#008553' }]}> 
          {t('language.switchTo')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#008553',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 