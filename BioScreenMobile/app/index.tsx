import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// RTL initialization is now handled in _layout.tsx after language is loaded

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