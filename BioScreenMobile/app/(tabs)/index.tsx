import MobileText from '@/components/MobileText';
import React, { useState, useEffect, useContext } from 'react';
import {
  ScrollView,
  RefreshControl,
  I18nManager,
  Dimensions,
} from 'react-native';
import { View, Text, Card, Button, TouchableOpacity, TextField, Modal, LoaderScreen } from 'react-native-ui-lib';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { apiRequest } from '@/lib/api';
import { ScreeningWithDetails } from '@/lib/screening-utils';
import { SelectedPersonContext } from '../../context/SelectedPersonContext';

interface DashboardStats {
  totalScreenings: number;
  dueScreenings: number;
  overdueScreenings: number;
  laterScreenings: number;
  completedThisYear: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
}

interface EducationalContent {
  id: number;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
}

interface UserDataResponse {
  screenings: any[];
}

interface FamilyMember {
  id: number;
  name: string;
}

interface FamilyMemberResponse {
  familyMember: { name: string; dateOfBirth: string; gender: string };
  screenings: any[];
  bmiInfo?: {
    value: number;
    category: string;
  };
}

/*
Read this
Make mobile native text compoennt (if it doesn't already exist)
Grep every occurance of <Text> in the app, list the components, make a plan to
1. import the newly created component using prefix alias (DONT USE RELATIVE PATH)
2. Replace <Text> with <RNText> (With a sed command, do not replace manually)
Replace </Text> (Closing tag) as well
Apply to all files in one go
Do not use file edit tool, rely solely on bash commands to achieve this goal
https://docs.expo.dev/guides/localization/#text-alignment
*/

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', content: '' });
  const { selectedPersonId, setSelectedPersonId } = useContext(SelectedPersonContext);

  const colors = Colors[colorScheme ?? 'light'];

  // Load user data from AsyncStorage
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('healthscreen_user');
        const userIdData = await AsyncStorage.getItem('healthscreen_user_id');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        if (userIdData) {
          setUserId(userIdData);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };
    loadUser();
  }, []);

  // Fetch user data with screenings
  const { data: userDataWithScreenings, isLoading, refetch } = useQuery<UserDataResponse>({
    queryKey: [`/api/users/${userId}`],
    queryFn: () => apiRequest('GET', `/api/users/${userId}`),
    enabled: !!userId,
  });

  // Fetch family members data
  const { data: familyMembersData } = useQuery<FamilyMember[]>({
    queryKey: ['/api/users', userId, 'family'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/family`),
    enabled: !!userId,
  });

  // Validate selected person when family members data changes
  useEffect(() => {
    if (familyMembersData && selectedPersonId !== "user") {
      const familyMemberExists = familyMembersData.some(member => member.id.toString() === selectedPersonId);
      if (!familyMemberExists) {
        console.log('Selected family member no longer exists, switching to user');
        setSelectedPersonId("user");
      }
    }
  }, [familyMembersData, selectedPersonId]);

  // Fetch selected person's screenings
  const { data: selectedPersonData, error: selectedPersonError } = useQuery({
    queryKey: selectedPersonId === "user" 
      ? [`/api/users/${userId}`] 
      : [`/api/family/${selectedPersonId}/screenings`],
    queryFn: () =>
      selectedPersonId === "user"
        ? apiRequest('GET', `/api/users/${userId}`)
        : apiRequest('GET', `/api/family/${selectedPersonId}/screenings`),
    enabled: !!userId && !!selectedPersonId && (
      selectedPersonId === "user" || 
      (familyMembersData && familyMembersData.some(member => member.id.toString() === selectedPersonId))
    ),
    retry: (failureCount, error: any) => {
      // If it's a family member not found error, don't retry
      if (error?.message?.includes('Family member not found')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Handle family member not found error - reset to user
  useEffect(() => {
    if (selectedPersonError && selectedPersonError.message?.includes('Family member not found')) {
      console.log('Selected family member not found, switching to user');
      setSelectedPersonId("user");
    }
  }, [selectedPersonError]);

  // Extract screenings based on selected person
  let screenings: any[] = [];
  if (selectedPersonData) {
    if (selectedPersonId === "user") {
      const userResponse = selectedPersonData as UserDataResponse;
      screenings = userResponse.screenings || [];
    } else {
      const familyResponse = selectedPersonData as FamilyMemberResponse;
      screenings = familyResponse.screenings || [];
    }
  }

  // Fetch educational content
  const { data: educationalContent = [] } = useQuery({
    queryKey: ['educational-content'],
    queryFn: async (): Promise<EducationalContent[]> => {
      return apiRequest('GET', '/api/educational-content?isActive=true');
    },
  });

  // Calculate stats from screenings data using the same logic as upcoming tests
  const calculateDashboardStats = (screenings: any[]): DashboardStats => {
    const stats = {
      totalScreenings: screenings.length,
      dueScreenings: 0,
      overdueScreenings: 0,
      laterScreenings: 0,
      completedThisYear: 0
    };

    screenings.forEach((screening) => {
      if (screening.status === 'due') stats.dueScreenings++;
      else if (screening.status === 'overdue') stats.overdueScreenings++;
      else if (screening.status === 'later') stats.laterScreenings++;
      else if (screening.status === 'completed') {
        // Check if completed this year
        if (screening.lastCompleted) {
          const completedDate = new Date(screening.lastCompleted);
          const currentYear = new Date().getFullYear();
          if (completedDate.getFullYear() === currentYear) {
            stats.completedThisYear++;
          }
        }
      }
    });

    return stats;
  };

  // Calculate stats from the selected person's screenings
  const stats = calculateDashboardStats(screenings);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name || '';
    
    if (hour < 12) {
      return name ? t('home.morningGreeting', { name }) : t('home.greeting');
    } else if (hour < 17) {
      return name ? t('home.afternoonGreeting', { name }) : t('home.greeting');
    } else {
      return name ? t('home.eveningGreeting', { name }) : t('home.greeting');
    }
  };

  if (isLoading && !userId) {
    return (
      <LoaderScreen color={colors.primary} message={t('common.loading')} backgroundColor={colors.background} />
    );
  }

  // return <View style={{
  //   paddingTop:insets.top
  // }}>
  //   <Text>
  //     Am I right to left or left to right
  //   </Text>
  // </View>
  
  return (
    <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        style={{ backgroundColor: '#202221' }}
      >
      {/* Header with Gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#202221', '#272A29'] : ['#003848', '#4CCCE6']}
        style={{ 
          paddingHorizontal: 16,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          overflow: 'hidden',
          minHeight: 160,
          paddingTop: insets.top + 16, 
          paddingBottom: 16 
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 2, textAlign: 'left', fontFamily: 'ReadexPro-Bold', color: '#FFFFFF' }}>
              {getGreeting()} 
            </Text>
            <Text style={{ fontSize: 20, fontFamily: 'ReadexPro', marginBottom: 2, color: '#FFFFFF' }}>
              {t('home.manageHealth')}
            </Text>
          </View>
          <TouchableOpacity 
            style={{ padding: 8 }}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
        {/* Family Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8, marginBottom: 8 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 8, alignItems: 'center' }}
        >
          <TouchableOpacity
            style={[
              { backgroundColor: '#2E3130', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, borderColor: '#045468' },
              selectedPersonId === 'user' && { backgroundColor: '#045468', borderColor: '#045468' }
            ]}
            onPress={() => setSelectedPersonId('user')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'ReadexPro-Bold' }}>{t('common.you')}</Text>
          </TouchableOpacity>
          {Array.isArray(familyMembersData) && familyMembersData.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                { backgroundColor: '#2E3130', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, borderColor: '#045468' },
                selectedPersonId === member.id.toString() && { backgroundColor: '#045468', borderColor: '#045468' }
              ]}
              onPress={() => setSelectedPersonId(member.id.toString())}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'ReadexPro-Bold' }}>{member.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Stats Cards */}
      <View paddingH-s5 marginB-s5>
        <Text h4 marginB-s4 style={{ textAlign: 'left', color: '#FFFFFF', fontFamily: 'ReadexPro-Bold' }}>
          {t('home.testStatus')}
        </Text>
        <View row style={{ justifyContent: 'space-between', gap: 8 }}>
          <Card 
            padding-s4 
            center 
            backgroundColor="#1A4D5C" 
            enableShadow 
            elevation={3}
            style={{ flex: 1, height: 110, justifyContent: 'center', borderRadius: 16 }}
          >
            <Text 
              style={{ 
                fontSize: 36, 
                fontFamily: 'ReadexPro-Bold', 
                color: '#4CCCE6',
                marginBottom: 8
              }}
            >
              {stats.completedThisYear}
            </Text>
            <Text 
              style={{ 
                fontFamily: 'ReadexPro-SemiBold', 
                textAlign: 'center', 
                color: '#FFFFFF',
                fontSize: 10
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.tabs.done')}
            </Text>
          </Card>

          <Card 
            padding-s4 
            center 
            backgroundColor="#1A4D5C" 
            enableShadow 
            elevation={3}
            style={{ flex: 1, height: 110, justifyContent: 'center', borderRadius: 16 }}
          >
            <Text 
              style={{ 
                fontSize: 36, 
                fontFamily: 'ReadexPro-Bold', 
                color: '#FFFFFF',
                marginBottom: 8
              }}
            >
              {stats.laterScreenings}
            </Text>
            <Text 
              style={{ 
                fontFamily: 'ReadexPro-SemiBold', 
                textAlign: 'center', 
                color: '#FFFFFF',
                fontSize: 10
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.tabs.later')}
            </Text>
          </Card>

          <Card 
            padding-s4 
            center 
            backgroundColor="#1A4D5C" 
            enableShadow 
            elevation={3}
            style={{ flex: 1, height: 110, justifyContent: 'center', borderRadius: 16 }}
          >
            <Text 
              style={{ 
                fontSize: 36, 
                fontFamily: 'ReadexPro-Bold', 
                color: '#FF6B6B',
                marginBottom: 8
              }}
            >
              {stats.overdueScreenings}
            </Text>
            <Text 
              style={{ 
                fontFamily: 'ReadexPro-SemiBold', 
                textAlign: 'center', 
                color: '#FFFFFF',
                fontSize: 10
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.tabs.overdue')}
            </Text>
          </Card>

          <Card 
            padding-s4 
            center 
            backgroundColor="#1A4D5C" 
            enableShadow 
            elevation={3}
            style={{ flex: 1, height: 110, justifyContent: 'center', borderRadius: 16 }}
          >
            <Text 
              style={{ 
                fontSize: 36, 
                fontFamily: 'ReadexPro-Bold', 
                color: '#4CCCE6',
                marginBottom: 8
              }}
            >
              {stats.dueScreenings}
            </Text>
            <Text 
              style={{ 
                fontFamily: 'ReadexPro-SemiBold', 
                textAlign: 'center', 
                color: '#FFFFFF',
                fontSize: 12
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t('home.tabs.due')}
            </Text>
          </Card>
        </View>
      </View>

      {/* Educational Content - Middle Section */}
      <View paddingH-s5 marginB-s8>
        <Text h4 marginB-s4 style={{ textAlign: 'left', color: '#FFFFFF', fontFamily: 'ReadexPro-Bold' }}>
          {t('home.healthTips')}
        </Text>
        
        {educationalContent.length > 0 ? (
          <View>
            {educationalContent.slice(0, 3).map((content) => (
              <Card
                key={content.id}
                padding-s5
                marginB-s3
                backgroundColor="#2E3130"
                enableShadow
                elevation={3}
              >
                <Text body style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', marginBottom: 8, color: '#FFFFFF' }}>
                  {content.title}
                </Text>
                <Text bodySmall style={{ fontFamily: 'ReadexPro', lineHeight: 20, color: '#ECEDEE' }} numberOfLines={4}>
                  {content.content}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Card padding-s5 backgroundColor="#2E3130" enableShadow elevation={3}>
            <MaterialCommunityIcons name="information" size={32} color="#4CCCE6" />
            <Text body marginT-s3 marginB-s2 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', color: '#FFFFFF' }}>
              {t('home.defaultTipTitle')}
            </Text>
            <Text bodySmall style={{ fontFamily: 'ReadexPro', lineHeight: 20, color: '#ECEDEE' }}>
              {t('home.defaultTipContent')}
            </Text>
          </Card>
        )}
      </View>

      {/* Quick Actions - Bottom Section */}
      <View paddingH-s5 marginB-s5>
        <Text h4 marginB-s4 style={{ textAlign: 'left', color: '#FFFFFF', fontFamily: 'ReadexPro-Bold' }}>
          {t('home.quickActions')}
        </Text>
        
        <View row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            style={{ width: '48%', height: 140 }}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Card padding-s5 center marginB-s4 backgroundColor="#2E3130" enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account-group" size={32} color="#4CCCE6" />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: '#FFFFFF' }}>
                {t('home.addFamily')}
              </Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: '#ECEDEE' }}>
                {t('home.manageFamilyMembers')}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ width: '48%', height: 140 }}
            onPress={() => router.push('/(tabs)/upcoming-tests')}
          >
            <Card padding-s5 center marginB-s4 backgroundColor="#2E3130" enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-check" size={32} color="#4CCCE6" />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: '#FFFFFF' }}>
                {t('home.upcomingTests')}
              </Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: '#ECEDEE' }}>
                {t('home.viewScheduledTests')}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ width: '48%', height: 140 }}
            onPress={() => router.push('/(tabs)/completed-tests')}
          >
            <Card padding-s5 center marginB-s4 backgroundColor="#2E3130" enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="clipboard-check" size={32} color="#4CCCE6" />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: '#FFFFFF' }}>
                {t('home.completedTests')}
              </Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: '#ECEDEE' }}>
                {t('home.viewTestHistory')}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ width: '48%', height: 140 }}
            onPress={() => setShowContactModal(true)}
          >
            <Card padding-s5 center marginB-s4 backgroundColor="#2E3130" enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="email" size={32} color="#4CCCE6" />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: '#FFFFFF' }}>{t('contact.title')}</Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: '#ECEDEE' }}>{t('contact.description')}</Text>
            </Card>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom padding for better scrolling */}
      <View style={{ height: 20 }} />

      <Modal 
        visible={showContactModal} 
        onDismiss={() => setShowContactModal(false)}
        overlayBackgroundColor="rgba(0,0,0,0.2)"
      >
        <Card backgroundColor="#2E3130" padding-s6 style={{ minWidth: 320, width: '90%' }}>
            <Text h4 marginB-s4 center style={{ fontFamily: 'ReadexPro-Bold', color: '#4CCCE6' }}>{t('contact.title')}</Text>
            <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: '#FFFFFF' }}>{t('contact.name')}</Text>
            <TextField
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.name}
              onChangeText={text => setContactForm({ ...contactForm, name: text })}
              placeholder={t('contact.namePlaceholder')}
              placeholderTextColor="#94a3b8"
            />
            <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: '#FFFFFF' }}>{t('contact.email')}</Text>
            <TextField
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.email}
              onChangeText={text => setContactForm({ ...contactForm, email: text })}
              placeholder={t('contact.emailPlaceholder')}
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: '#FFFFFF' }}>{t('contact.subject')}</Text>
            <TextField
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.subject}
              onChangeText={text => setContactForm({ ...contactForm, subject: text })}
              placeholder={t('contact.subjectPlaceholder')}
              placeholderTextColor="#94a3b8"
            />
            <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: '#FFFFFF' }}>{t('contact.content')}</Text>
            <TextField
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 16, height: 80, textAlignVertical: 'top', backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.content}
              onChangeText={text => setContactForm({ ...contactForm, content: text })}
              placeholder={t('contact.contentPlaceholder')}
              placeholderTextColor="#94a3b8"
              multiline
            />
            <View row style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8 }}>
              <Button
                label={t('contact.send')}
                backgroundColor="primary"
                flex
                style={{ marginLeft: 8 }}
                onPress={() => { setShowContactModal(false); setContactForm({ name: '', email: '', subject: '', content: '' }); }}
              />
              <Button
                label={t('common.cancel')}
                backgroundColor="#202221"
                color="primary"
                flex
                onPress={() => setShowContactModal(false)}
              />
            </View>
          </Card>
      </Modal>
    </ScrollView>
  );
}
