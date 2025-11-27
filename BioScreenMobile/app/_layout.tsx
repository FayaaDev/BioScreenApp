import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { useEffect, useState } from 'react';
import { I18nManager, View, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavigationThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import { toastConfig } from '../components/ToastConfig';
import '../lib/i18n'; // Restore i18n import
import { loadStoredLanguage } from '../lib/i18n';
import { SelectedPersonProvider } from '../context/SelectedPersonContext';
import { initializeRTL, verifyRTL } from '../lib/rtlSetup';
import { DirectionTester } from '@/components/playground/DirectionTester';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// Create a client
const queryClient = new QueryClient();

function RootLayoutContent() {
  const { isDark } = useTheme();
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [loaded] = useFonts({
    ReadexPro: require('../assets/fonts/ReadexPro-Regular.ttf'),
    'ReadexPro-Bold': require('../assets/fonts/ReadexPro-Bold.ttf'),
    'ReadexPro-Medium': require('../assets/fonts/ReadexPro-Medium.ttf'),
    'ReadexPro-SemiBold': require('../assets/fonts/ReadexPro-SemiBold.ttf'),
  });

  // Load language preference and initialize RTL based on language
  useEffect(() => {
    const setupLanguageAndRTL = async () => {
      // Wait for both fonts and i18n to be ready
      if (loaded && i18n && i18n.isInitialized) {
        try {
          // Load stored language preference and apply to i18n
          await loadStoredLanguage();

          // Initialize RTL based on stored language (no argument needed)
          await initializeRTL();

          setIsReady(true);
        } catch (error) {
          console.error('Error setting up language and RTL:', error);
          // Fallback: initialize RTL with default
          await initializeRTL();
          setIsReady(true);
        }
      }
    };

    setupLanguageAndRTL();
  }, [loaded, i18n]);

  // Set up Readex Pro font with error handling
  useEffect(() => {
    try {
      // Set default font for Text components
      const defaultFont = (Text as any).defaultProps || {};
      defaultFont.style = defaultFont.style || {};
      defaultFont.style.fontFamily = 'ReadexPro';
      (Text as any).defaultProps = defaultFont;

      // Set default font for TextInput components
      const defaultInputFont = (TextInput as any).defaultProps || {};
      defaultInputFont.style = defaultInputFont.style || {};
      defaultInputFont.style.fontFamily = 'ReadexPro';
      (TextInput as any).defaultProps = defaultInputFont;

      console.log('Readex Pro font applied successfully');
    } catch (error) {
      console.warn('Failed to apply Readex Pro font:', error);
    }
  }, []);

  if (!loaded || !isReady) {
    return null;
  }

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <SelectedPersonProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="intro" options={{ animation: 'none' }} />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" />
          <Toast config={toastConfig} />
        </SelectedPersonProvider>
      </QueryClientProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
