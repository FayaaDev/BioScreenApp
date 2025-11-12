import { I18nManager, Platform } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * Centralized RTL setup that must be called BEFORE any UI components render.
 * This ensures RTL is properly initialized in production builds (TestFlight) 
 * where the timing differs from Expo Go.
 */
export function initializeRTL(): boolean {
  const needsReload = !I18nManager.isRTL;
  
  // Force RTL for Arabic app - must happen synchronously before render
  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
    
    console.log('[RTL Setup] Forced RTL mode enabled');
    
    // In production builds, forceRTL requires a reload to take effect
    // This is critical for TestFlight builds where the layout is cached
    if (Platform.OS === 'ios' && !__DEV__ && Updates.isEnabled) {
      console.log('[RTL Setup] Production build detected - reload required for RTL');
      // Note: We can't reload here synchronously, but we'll handle it in _layout.tsx
      return true;
    }
  } else {
    console.log('[RTL Setup] RTL already enabled');
  }
  
  return false;
}

/**
 * Check if RTL is properly configured and reload if needed
 * Call this in a useEffect after fonts/i18n are ready
 */
export async function ensureRTLAndReloadIfNeeded(): Promise<void> {
  if (!I18nManager.isRTL && Platform.OS === 'ios' && !__DEV__) {
    console.log('[RTL Setup] RTL not active in production - reloading app');
    try {
      if (Updates.isEnabled) {
        await Updates.reloadAsync();
      }
    } catch (error) {
      console.error('[RTL Setup] Failed to reload:', error);
      // If Updates.reloadAsync fails, we can't do much else
      // The app will continue but RTL might not work properly
    }
  }
}

