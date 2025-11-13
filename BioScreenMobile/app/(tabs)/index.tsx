import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  I18nManager,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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

const { width } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

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
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CCCE6']} // Android
          tintColor="#4CCCE6" // iOS
          title="جاري التحديث..." // iOS
          titleColor="#4CCCE6" // iOS
        />
      }
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#202221', '#272A29'] : ['#003848', '#4CCCE6']}
        style={[styles.headerGradient, { paddingTop: insets.top + 16, paddingBottom: 10 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={[styles.greeting, { color: 'white' }]}>
              {getGreeting()}
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: 'rgba(255,255,255,0.9)' }]}>
              {t('home.manageHealth')}
            </ThemedText>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
        {/* Family Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 8 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 8 }}>
          <TouchableOpacity
            style={[styles.familyButton, selectedPersonId === 'user' && styles.familyButtonSelected]}
            onPress={() => setSelectedPersonId('user')}
          >
            <Text style={[styles.familyButtonText, selectedPersonId === 'user' && styles.familyButtonSelectedText]}>أنت</Text>
          </TouchableOpacity>
          {Array.isArray(familyMembersData) && familyMembersData.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.familyButton, selectedPersonId === member.id.toString() && styles.familyButtonSelected]}
              onPress={() => setSelectedPersonId(member.id.toString())}
            >
              <Text style={[styles.familyButtonText, selectedPersonId === member.id.toString() && styles.familyButtonSelectedText]}>{member.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Test Status Stats - Top Section */}
      <View style={styles.statsContainer}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.testStatus')}
        </ThemedText>
        
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/upcoming-tests',
                params: { initialTab: 'due' }
              });
            }}
          >
            <Text style={[styles.statNumber, styles.statNumberDue]}>
              {stats?.dueScreenings || 0}
            </Text>
            <Text style={styles.statLabel}>
              حالاً
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/upcoming-tests',
                params: { initialTab: 'overdue' }
              });
            }}
          >
            <Text style={[styles.statNumber, styles.statNumberOverdue]}>
              {stats?.overdueScreenings || 0}
            </Text>
            <Text style={styles.statLabel}>
              متأخر
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/upcoming-tests',
                params: { initialTab: 'later' }
              });
            }}
          >
            <Text style={[styles.statNumber, styles.statNumberLater]}>
              {stats?.laterScreenings || 0}
            </Text>
            <Text style={styles.statLabel}>
              لاحقاً
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => router.push('/(tabs)/completed-tests')}
          >
            <Text style={[styles.statNumber, styles.statNumberCompleted]}>
              {stats?.completedThisYear || 0}
            </Text>
            <Text style={styles.statLabel}>
              مكتمل
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Educational Content - Middle Section */}
      <View style={styles.educationalSection}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.healthTips')}
        </ThemedText>
        
        {educationalContent.length > 0 ? (
          <View style={{ width: '100%' }}>
            {educationalContent.slice(0, 3).map((content) => (
              <View 
                key={content.id} 
                style={[
                  styles.educationalCard, 
                  { backgroundColor: colors.card, marginBottom: 12 }
                ]}
              >
                <ThemedText style={[styles.educationalTitle, { color: colors.text, fontFamily: 'ReadexPro-Bold' }]}>
                  {content.title}
                </ThemedText>
                <ThemedText style={[styles.educationalContent, { color: colors.textSecondary, fontFamily: 'ReadexPro' }]} numberOfLines={4}>
                  {content.content}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.educationalCard, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="information" size={32} color={colors.textSecondary} />
            <ThemedText style={[styles.educationalTitle, { color: colors.text }]}>
              {t('home.defaultTipTitle')}
            </ThemedText>
            <ThemedText style={[styles.educationalContent, { color: colors.textSecondary }]}>
              {t('home.defaultTipContent')}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Quick Actions - Bottom Section */}
      <View style={styles.quickActionsSection}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.quickActions')}
        </ThemedText>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
            <ThemedText style={[styles.actionTitle, { color: colors.text }]}>
              {t('home.addFamily')}
            </ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('home.manageFamilyMembers')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/upcoming-tests')}
          >
            <MaterialCommunityIcons name="calendar-check" size={32} color={colors.primary} />
            <ThemedText style={[styles.actionTitle, { color: colors.text }]}>
              {t('home.upcomingTests')}
            </ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('home.viewScheduledTests')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/completed-tests')}
          >
            <MaterialCommunityIcons name="clipboard-check" size={32} color={colors.primary} />
            <ThemedText style={[styles.actionTitle, { color: colors.text }]}>
              {t('home.completedTests')}
            </ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {t('home.viewTestHistory')}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => setShowContactModal(true)}
          >
            <MaterialCommunityIcons name="email" size={32} color={colors.primary} />
            <ThemedText style={[styles.actionTitle, { color: colors.text }]}>تواصل معنا</ThemedText>
            <ThemedText style={[styles.actionSubtitle, { color: colors.textSecondary }]}>راسلنا لأي استفسار أو اقتراح</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom padding for better scrolling */}
      <View style={styles.bottomPadding} />

      <Modal visible={showContactModal} animationType="slide" transparent onRequestClose={() => setShowContactModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#2E3130', borderRadius: 16, padding: 24, minWidth: 320, width: '90%' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CCCE6', marginBottom: 16, textAlign: 'center', fontFamily: 'ReadexPro-Bold' }}>تواصل معنا</Text>
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right', color: '#ECEDEE', fontFamily: 'ReadexPro' }}>الاسم</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right', backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.name}
              onChangeText={text => setContactForm({ ...contactForm, name: text })}
              placeholder="أدخل اسمك"
              placeholderTextColor="#94a3b8"
            />
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right', color: '#ECEDEE', fontFamily: 'ReadexPro' }}>البريد الإلكتروني</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right', backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.email}
              onChangeText={text => setContactForm({ ...contactForm, email: text })}
              placeholder="أدخل بريدك الإلكتروني"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right', color: '#ECEDEE', fontFamily: 'ReadexPro' }}>الموضوع</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right', backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.subject}
              onChangeText={text => setContactForm({ ...contactForm, subject: text })}
              placeholder="أدخل موضوع الرسالة"
              placeholderTextColor="#94a3b8"
            />
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right', color: '#ECEDEE', fontFamily: 'ReadexPro' }}>المحتوى</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#555', borderRadius: 8, padding: 10, marginBottom: 16, textAlign: 'right', height: 80, textAlignVertical: 'top', backgroundColor: '#202221', color: '#ECEDEE', fontFamily: 'ReadexPro' }}
              value={contactForm.content}
              onChangeText={text => setContactForm({ ...contactForm, content: text })}
              placeholder="اكتب رسالتك هنا"
              placeholderTextColor="#94a3b8"
              multiline
            />
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#4CCCE6', borderRadius: 8, paddingVertical: 12, flex: 1, alignItems: 'center', marginLeft: 8 }}
                onPress={() => { setShowContactModal(false); setContactForm({ name: '', email: '', subject: '', content: '' }); }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold' }}>إرسال</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#202221', borderRadius: 8, paddingVertical: 12, flex: 1, alignItems: 'center' }}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={{ color: '#4CCCE6', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold' }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  headerGradient: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'ReadexPro-Bold',
  },
  subtitle: {
    fontSize: 20,
    opacity: 0.9,
    textAlign: 'right',
    fontFamily: 'ReadexPro',
    marginBottom: 2,
  },
  profileButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
    fontFamily: 'ReadexPro-Bold',
  },
  
  // Stats Section
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    marginHorizontal: 6,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#004558',
    borderWidth: 1,
    borderColor: '#555',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'ReadexPro-Bold',
  },
  statNumberDue: {
    color: '#3b82f6', // Blue for حالاً (due)
  },
  statNumberOverdue: {
    color: '#A35829', // Red for متأخر (overdue)
  },
  statNumberLater: {
    color: '#fff', // White for لاحقاً (later)
  },
  statNumberCompleted: {
    color: '#4CCCE6', // Green for مكتملة (completed)
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#ECEDEE',
    fontFamily: 'ReadexPro-Medium',
  },

  // Educational Section
  educationalSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'flex-end',
  },
  educationalCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  educationalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'ReadexPro-Bold',
  },
  educationalContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'ReadexPro',
  },

  // Quick Actions Section
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'ReadexPro-Bold',
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'ReadexPro',
  },
  bottomPadding: {
    height: 20,
  },
  familyButton: {
    backgroundColor: '#2E3130',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#045468',
    marginRight: 8,
  },
  familyButtonSelected: {
    backgroundColor: '#045468',
    borderColor: '#045468',
  },
  familyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'ReadexPro-Bold',
  },
  familyButtonSelectedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'ReadexPro-Bold',
  },
});
