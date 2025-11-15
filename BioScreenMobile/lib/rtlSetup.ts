import { I18nManager, Platform, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { getStoredLanguage, Language } from './languageManager';

/**
 * Initialize RTL based on stored language preference
 * This should be called early in the app lifecycle after language is loaded
 * @param language Language code ('ar' or 'en')
 */
export async function initializeRTL(language?: Language): Promise<void> {
  try {
    // If language not provided, load from storage
    const lang = language || await getStoredLanguage();
    const isRTL = lang === 'ar';
    
    // Only change if different from current state
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
      Updates.reloadAsync();
      
      console.log(`[RTL Setup] RTL ${isRTL ? 'enabled' : 'disabled'} for language: ${lang}`);
      
    } else {
      console.log(`[RTL Setup] RTL already ${isRTL ? 'enabled' : 'disabled'} for language: ${lang}`);
    }
    
    // Log RTL state for debugging
    console.log(`[RTL Setup] RTL Status - isRTL: ${I18nManager.isRTL}, Language: ${lang}, Platform: ${Platform.OS}, isDev: ${__DEV__}`);
  } catch (error) {
    console.error('[RTL Setup] Error initializing RTL:', error);
    // Fallback to RTL (Arabic) on error
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      I18nManager.allowRTL(true);
    }
  }
}

/**
 * Change RTL direction and prompt user to restart app
 * iOS requires app restart for RTL/LTR changes to take effect
 * @param isRTL Whether to enable RTL (true) or LTR (false)
 * @param onRestart Optional callback when user chooses to restart
 */
export async function changeRTLDirection(isRTL: boolean, onRestart?: () => void): Promise<void> {
  try {
    // Update RTL direction
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(true);
    
    console.log(`[RTL Setup] RTL direction changed to: ${isRTL ? 'RTL' : 'LTR'}`);
    
    // Helper function to handle app restart
    const handleRestart = async () => {
      try {
        if (onRestart) {
          onRestart();
          return;
        }
        
        // In development mode, Updates.reloadAsync() may not work properly
        // Always show manual restart instructions in development
        if (__DEV__) {
          Alert.alert(
            isRTL ? 'إعادة التشغيل المطلوبة' : 'Restart Required',
            isRTL 
              ? 'يرجى إغلاق التطبيق يدوياً وإعادة فتحه لتطبيق التغييرات.'
              : 'Please close and reopen the app manually to apply changes.',
            [{ text: isRTL ? 'حسناً' : 'OK' }]
          );
          return;
        }
        
        // In production, check if Updates is available and enabled before attempting reload
        let canReload = false;
        try {
          canReload = Updates.isEnabled && typeof Updates.reloadAsync === 'function';
        } catch (checkError) {
          console.warn('Could not check Updates availability:', checkError);
          canReload = false;
        }
        
        if (canReload) {
          try {
            await Updates.reloadAsync();
          } catch (reloadError) {
            // If reloadAsync fails, fall back to manual restart instructions
            console.error('Updates.reloadAsync failed:', reloadError);
            throw reloadError; // Re-throw to show manual restart alert
          }
        } else {
          // Updates not available or not enabled, show manual restart instructions
          Alert.alert(
            isRTL ? 'إعادة التشغيل المطلوبة' : 'Restart Required',
            isRTL 
              ? 'يرجى إغلاق التطبيق يدوياً وإعادة فتحه لتطبيق التغييرات.'
              : 'Please close and reopen the app manually to apply changes.',
            [{ text: isRTL ? 'حسناً' : 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error restarting app:', error);
        Alert.alert(
          isRTL ? 'إعادة التشغيل المطلوبة' : 'Restart Required',
          isRTL 
            ? 'يرجى إغلاق التطبيق يدوياً وإعادة فتحه لتطبيق التغييرات.'
            : 'Please close and reopen the app manually to apply changes.',
          [{ text: isRTL ? 'حسناً' : 'OK' }]
        );
      }
    };
    
    // Show alert about restart requirement (iOS limitation)
    if (Platform.OS === 'ios') {
      Alert.alert(
        isRTL ? 'تم تغيير اللغة إلى العربية' : 'Language Changed to English',
        isRTL 
          ? 'يجب إعادة تشغيل التطبيق لتطبيق التغييرات. هل تريد إعادة التشغيل الآن؟'
          : 'The app needs to restart to apply changes. Would you like to restart now?',
        [
          {
            text: isRTL ? 'لاحقاً' : 'Later',
            style: 'cancel',
          },
          {
            text: isRTL ? 'إعادة التشغيل' : 'Restart',
            onPress: handleRestart,
          },
        ]
      );
    } else {
      // Android doesn't require restart, but we can still offer it
      await handleRestart();
    }
  } catch (error) {
    console.error('[RTL Setup] Error changing RTL direction:', error);
  }
}

/**
 * Verify RTL is properly configured (non-blocking check)
 */
export function verifyRTL(): boolean {
  const isRTLActive = I18nManager.isRTL;
  if (!isRTLActive) {
    console.warn('[RTL Setup] Warning: RTL is not active.');
  }
  return isRTLActive;
}

