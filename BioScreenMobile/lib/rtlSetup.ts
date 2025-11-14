import { I18nManager, Platform } from 'react-native';

/**
 * Centralized RTL setup that must be called BEFORE any UI components render.
 * Native RTL initialization in AppDelegate.swift handles the primary RTL setup,
 * but we ensure JavaScript-side RTL is also enabled as a fallback.
 */
export function initializeRTL(): void {
  // Force RTL for Arabic app - must happen synchronously before render
  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
    console.log('[RTL Setup] JavaScript RTL mode enabled (native RTL should already be active)');
  } else {
    console.log('[RTL Setup] RTL already enabled');
  }
  
  // Log RTL state for debugging
  console.log(`[RTL Setup] RTL Status - isRTL: ${I18nManager.isRTL}, Platform: ${Platform.OS}, isDev: ${__DEV__}`);
}

/**
 * Verify RTL is properly configured (non-blocking check)
 * Native initialization in AppDelegate should handle RTL, so this is just for verification
 */
export function verifyRTL(): boolean {
  const isRTLActive = I18nManager.isRTL;
  if (!isRTLActive) {
    console.warn('[RTL Setup] Warning: RTL is not active. Native initialization may have failed.');
  }
  return isRTLActive;
}

