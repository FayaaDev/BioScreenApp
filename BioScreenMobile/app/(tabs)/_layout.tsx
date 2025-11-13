import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      console.log('Tab layout - current language:', i18n.language);
      console.log('Translations:', {
        home: t('navigation.home'),
        upcoming: t('navigation.upcoming'),
        completed: t('navigation.completed'),
        profile: t('navigation.profile')
      });
      setRefreshKey(prev => prev + 1);
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [i18n, t]);

  return (
    <Tabs
      key={refreshKey}
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: '#171918',
          },
          default: {
            backgroundColor: '#171918',
          },
        }),
      }}>
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="completed-tests"
        options={{
          title: t('navigation.completed'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="check-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upcoming-tests"
        options={{
          title: t('navigation.upcoming'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="calendar-clock" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.home'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
