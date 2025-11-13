import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { initializeRTL } from '../lib/rtlSetup';

// Initialize RTL BEFORE any UI renders - critical for production builds
initializeRTL();

export default function Index() {
  useEffect(() => {
    const checkAuth = async () => {
      const userId = await AsyncStorage.getItem('healthscreen_user_id');
      if (userId) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    };
    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
} 