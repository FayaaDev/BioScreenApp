import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';
import { I18nManager, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import { toastConfig } from '../components/ToastConfig';
import '../lib/i18n';
import { SelectedPersonProvider } from '../context/SelectedPersonContext';

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    NotoSansArabic: require('../assets/fonts/NotoSansArabic-Regular.ttf'),
  });

  // Initialize RTL based on language
  useEffect(() => {
    const handleLanguageChange = () => {
      // Force Arabic and RTL
      const isRTL = true;
      console.log('App layout - current language: ar');
      console.log('Setting RTL to:', isRTL);
      
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    };

    // Handle initial setup
    if (i18n.isInitialized) {
      handleLanguageChange();
      setIsReady(true);
    }

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);
    i18n.on('initialized', () => {
      handleLanguageChange();
      setIsReady(true);
    });

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
      i18n.off('initialized', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    if (i18n.language === 'ar') {
      const defaultFont = (Text as any).defaultProps || {};
      defaultFont.style = defaultFont.style || {};
      defaultFont.style.fontFamily = 'NotoSansArabic';
      (Text as any).defaultProps = defaultFont;
    }
  }, [i18n.language]);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <SelectedPersonProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="login" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          <Toast config={toastConfig} />
        </SelectedPersonProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
