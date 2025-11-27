import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoaderScreen, Colors } from 'react-native-ui-lib';

const INTRO_STORAGE_KEY = 'intro_completed';

// RTL initialization is now handled in _layout.tsx after language is loaded

export default function Index() {
  useEffect(() => {
    const checkAuthAndIntro = async () => {
      // First check if intro has been completed
      const introCompleted = await AsyncStorage.getItem(INTRO_STORAGE_KEY);
      if (introCompleted !== 'true') {
        router.replace('/intro');
        return;
      }

      // Then check authentication
      const userId = await AsyncStorage.getItem('healthscreen_user_id');
      if (userId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    };
    checkAuthAndIntro();
  }, []);

  return (
    <LoaderScreen color={Colors.primary} />
  );
} 