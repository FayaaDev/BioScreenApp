import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sehaty.app',
  appName: 'صحتي - Sehaty',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    // Development server URL using your VPS IP address
    url: 'http://192.64.87.218:5000',
    cleartext: true,
    allowNavigation: [
      "http://192.64.87.218:5000",
      "http://localhost:5000",
      "http://127.0.0.1:5000"
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#008553",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'light',
      backgroundColor: "#008553"
    }
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    scheme: 'capacitor'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;
