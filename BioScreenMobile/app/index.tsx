import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoaderScreen } from 'react-native-ui-lib';

// RTL initialization is now handled in _layout.tsx after language is loaded

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await AsyncStorage.getItem('healthscreen_user_id');
      if (userId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    };
    checkAuth();
  }, []);

  return (
    <LoaderScreen color="#4CCCE6" />
  );
} 