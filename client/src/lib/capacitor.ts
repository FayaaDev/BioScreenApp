import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';

// Check if running in Capacitor
export const isNativeApp = () => {
  return (window as any).Capacitor !== undefined;
};

// Initialize mobile app features
export const initializeMobileApp = async () => {
  if (!isNativeApp()) return;

  try {
    // Configure status bar
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#008553' });

    // Hide splash screen after initialization
    await SplashScreen.hide();

    // Configure keyboard behavior
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });

    // Handle app state changes
    App.addListener('appStateChange', (state) => {
      console.log('App state changed:', state);
    });

  } catch (error) {
    console.warn('Error initializing mobile app features:', error);
  }
};

// Haptic feedback utilities
export const hapticFeedback = {
  light: () => isNativeApp() && Haptics.impact({ style: ImpactStyle.Light }),
  medium: () => isNativeApp() && Haptics.impact({ style: ImpactStyle.Medium }),
  heavy: () => isNativeApp() && Haptics.impact({ style: ImpactStyle.Heavy }),
};

// App info utilities
export const getAppInfo = async () => {
  if (!isNativeApp()) return null;
  
  try {
    const info = await App.getInfo();
    return info;
  } catch (error) {
    console.warn('Error getting app info:', error);
    return null;
  }
};