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
      CFBundleDisplayName: 'Bakker',
      UIDeviceFamily: [1], // iPhone only (1 = iPhone, 2 = iPad, [1,2] = Universal)
      NSAppTransportSecurity: {
        NSExceptionDomains: {
          'bakkerapp.com': {
            NSExceptionAllowsInsecureHTTPLoads: false,
            NSExceptionRequiresForwardSecrecy: false
          },
          'localhost': {
            NSExceptionAllowsInsecureHTTPLoads: true,
            NSExceptionMinimumTLSVersion: '1.0'
          }
        }
      }
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
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://bakkerapp.com',
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || 'deba6310-3743-444c-af2f-31305565708d'
    }
  },
  plugins: [
    'expo-router'
  ]
}); 