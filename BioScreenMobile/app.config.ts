import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'زمام',
  slug: 'zimam',
  version: '1.0.2',
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
    buildNumber: '19',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      CFBundleDisplayName: 'زمام',
      UIDeviceFamily: [1], // iPhone only (1 = iPhone, 2 = iPad, [1,2] = Universal)
      UIRequiredDeviceCapabilities: ['telephony'],
      UIViewSemanticContentAttribute: 'ForceRightToLeft',
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
      projectId: process.env.EXPO_PROJECT_ID || 'deba6310-3743-444c-af2f-31305565708d'
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