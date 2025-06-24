import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Bakker',
  slug: 'bakker',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.bakker.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSUserNotificationsUsageDescription: 'This app uses notifications to remind you about important health screenings and medical appointments to help you maintain your health.',
      UIBackgroundModes: ['remote-notification'],
      CFBundleDisplayName: 'Bakker',
      UIRequiredDeviceCapabilities: ['telephony']
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.bakker.app'
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://192.64.87.218:5000',
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || 'deba6310-3743-444c-af2f-31305565708d'
    }
  },
  plugins: [
    'expo-router'
  ]
}); 