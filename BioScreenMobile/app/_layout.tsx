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
import '../lib/i18n'; // Restore i18n import
import { SelectedPersonProvider } from '../context/SelectedPersonContext';

// // Force RTL only once
// if (!I18nManager.isRTL) {
//   I18nManager.forceRTL(true);
//   I18nManager.allowRTL(true);
//   // Reload required for effect to take place
// }

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

  // Initialize RTL in a safer way
  useEffect(() => {
    const handleLanguageChange = () => {
      // Simple RTL setup with a safe force to ensure layout consistency
      console.log('App layout - setting up RTL for Arabic');

      if (!I18nManager.isRTL) {
        I18nManager.forceRTL(true);
      }
      I18nManager.allowRTL(true);
    };

    // Wait for both fonts and i18n to be ready
    if (loaded && i18n && i18n.isInitialized) {
      handleLanguageChange();
      setIsReady(true);
    }
  }, [loaded, i18n]);

  // Set up Arabic font with error handling
  useEffect(() => {
    try {
      if (i18n && i18n.language === 'ar') {
        const defaultFont = (Text as any).defaultProps || {};
        defaultFont.style = defaultFont.style || {};
        defaultFont.style.fontFamily = 'NotoSansArabic';
        (Text as any).defaultProps = defaultFont;
        console.log('Arabic font applied successfully');
      }
    } catch (error) {
      console.warn('Failed to apply Arabic font:', error);
    }
  }, [i18n?.language]);

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
