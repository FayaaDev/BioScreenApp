import React, { useState, useEffect } from 'react';
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

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { apiRequest } from '@/lib/api';
import { ScreeningWithDetails } from '@/lib/screening-utils';

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

const { width } = Dimensions.get('window');
const isRTL = I18nManager.isRTL;

export default function HomeScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', content: '' });

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
  const { data: userDataWithScreenings, isLoading, refetch } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest('GET', `/api/users/${userId}`),
    enabled: !!userId,
  });

  // Extract screenings from user data
  let screenings: any[] = [];
  if (userDataWithScreenings && typeof userDataWithScreenings === 'object' && userDataWithScreenings !== null && 'screenings' in userDataWithScreenings) {
    const userData = userDataWithScreenings as { screenings: any[] };
    screenings = userData.screenings || [];
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

  // Calculate stats from fetched screenings
  const stats = calculateDashboardStats(screenings);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#1a365d', '#2d5a87'] : ['#4ade80', '#22c55e']}
        style={styles.headerGradient}
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
      </LinearGradient>

      {/* Test Status Stats - Top Section */}
      <View style={styles.statsContainer}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.testStatus')}
        </ThemedText>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, styles.statNumberDue]}>
              {stats?.dueScreenings || 0}
            </Text>
            <Text style={styles.statLabel}>
              حالاً
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, styles.statNumberOverdue]}>
              {stats?.overdueScreenings || 0}
            </Text>
            <Text style={styles.statLabel}>
              متأخر
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, styles.statNumberLater]}>
              {stats?.laterScreenings || 0}
            </Text>
            <Text style={styles.statLabel}>
              لاحقاً
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, styles.statNumberCompleted]}>
              {stats?.completedThisYear || 0}
            </Text>
            <Text style={styles.statLabel}>
              مكتمل
            </Text>
          </View>
        </View>
      </View>

      {/* Educational Content - Middle Section */}
      <View style={styles.educationalSection}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          {t('home.healthTips')}
        </ThemedText>
        
        {educationalContent.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{ transform: [{ scaleX: -1 }] }}
          >
            {educationalContent.slice(0, 3).map((content) => (
              <View 
                key={content.id} 
                style={[
                  styles.educationalCard, 
                  { backgroundColor: colors.card, transform: [{ scaleX: -1 }] }
                ]}
              >
                <ThemedText style={[styles.educationalTitle, { color: colors.text, fontFamily: 'NotoSansArabic-Bold' }]}>
                  {content.title}
                </ThemedText>
                <ThemedText style={[styles.educationalContent, { color: colors.textSecondary, fontFamily: 'NotoSansArabic-Regular' }]} numberOfLines={4}>
                  {content.content}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
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
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, minWidth: 320, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#008553', marginBottom: 16, textAlign: 'center' }}>تواصل معنا</Text>
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right' }}>الاسم</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right' }}
              value={contactForm.name}
              onChangeText={text => setContactForm({ ...contactForm, name: text })}
              placeholder="أدخل اسمك"
            />
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right' }}>البريد الإلكتروني</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right' }}
              value={contactForm.email}
              onChangeText={text => setContactForm({ ...contactForm, email: text })}
              placeholder="أدخل بريدك الإلكتروني"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right' }}>الموضوع</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 12, textAlign: 'right' }}
              value={contactForm.subject}
              onChangeText={text => setContactForm({ ...contactForm, subject: text })}
              placeholder="أدخل موضوع الرسالة"
            />
            <Text style={{ fontSize: 16, marginBottom: 8, textAlign: 'right' }}>المحتوى</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 16, textAlign: 'right', height: 80, textAlignVertical: 'top' }}
              value={contactForm.content}
              onChangeText={text => setContactForm({ ...contactForm, content: text })}
              placeholder="اكتب رسالتك هنا"
              multiline
            />
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#008553', borderRadius: 8, paddingVertical: 12, flex: 1, alignItems: 'center', marginLeft: 8 }}
                onPress={() => { setShowContactModal(false); setContactForm({ name: '', email: '', subject: '', content: '' }); }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>إرسال</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#f0f0f0', borderRadius: 8, paddingVertical: 12, flex: 1, alignItems: 'center' }}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={{ color: '#008553', fontWeight: 'bold', fontSize: 16 }}>إلغاء</Text>
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
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'right',
  },
  profileButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'right',
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
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.3)',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statNumberDue: {
    color: '#3b82f6', // Blue for حالاً (due)
  },
  statNumberOverdue: {
    color: '#ef4444', // Red for متأخر (overdue)
  },
  statNumberLater: {
    color: '#f97316', // Orange for لاحقاً (later)
  },
  statNumberCompleted: {
    color: '#22c55e', // Green for مكتملة (completed)
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
  },

  // Educational Section
  educationalSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'flex-end',
  },
  educationalCard: {
    width: width * 0.75,
    marginLeft: 16,
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
  },
  educationalContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'right',
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
  },
  actionSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomPadding: {
    height: 20,
  },
});
