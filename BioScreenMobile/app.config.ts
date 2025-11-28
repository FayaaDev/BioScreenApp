import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'زمام',
  slug: 'zimam',
  version: '1.2',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#4CCCE6'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.zimam.app',
    buildNumber: '1',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: 'زمام',
      CFBundleDevelopmentRegion: 'ar',
      CFBundleLocalizations: ['ar'],
      UIDeviceFamily: [1], // iPhone only (1 = iPhone, 2 = iPad, [1,2] = Universal)
      UIRequiredDeviceCapabilities: ['telephony'],
      // UIViewSemanticContentAttribute: 'ForceRightToLeft', // Removed - Let JS handle RTL dynamically
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
      backgroundColor: '#4CCCE6'
    },
    package: 'com.zimam.app'
  },
  web: {
    favicon: './assets/images/favicon.png'
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://bakkerapp.com',
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || 'e87ae0b1-ff72-4e3a-b358-19c7b73dfe4c'
    }
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#4CCCE6'
      }
    ],
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/images/icon.png',
        color: '#4CCCE6',
        defaultChannel: 'default'
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  }
}); 