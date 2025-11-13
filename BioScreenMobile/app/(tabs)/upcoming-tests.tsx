import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  I18nManager,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { STATUS_COLORS, calculateNextDueDate, ScreeningWithDetails } from '../../lib/screening-utils';
import Tooltip from 'react-native-walkthrough-tooltip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext } from 'react';
import { SelectedPersonContext } from '../../context/SelectedPersonContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../../hooks/useColorScheme';
// import { ScreeningCard } from '../../components/ScreeningCard'; // Placeholder below

type UserDataResponse = {
  user: { name?: string; dateOfBirth: string; gender: string };
  screenings: ScreeningWithDetails[];
};

type FamilyMemberResponse = {
  familyMember: { name: string; dateOfBirth: string; gender: string };
  screenings: ScreeningWithDetails[];
};

// Helper function to get frequency text in Arabic only
const getFrequencyText = (years: number) => {
  if (years === 0) return 'مرة واحدة فقط';
  if (years === 1) return 'كل سنة';
  if (years === 2) return 'كل سنتين';
  if (years === 3) return 'كل ثلاث سنوات';
  if (years === 4) return 'كل أربع سنوات';
  if (years === 5) return 'كل خمس سنوات';
  return `كل ${years} سنة`;
};

// Placeholder for ScreeningCard
const ScreeningCard = ({ screening, onSchedule, onMarkCompleted, isRTL, userBirthDate }: {
  screening: ScreeningWithDetails;
  onSchedule: () => void;
  onMarkCompleted: () => void;
  isRTL: boolean;
  userBirthDate: string;
}) => {
  const [showTip, setShowTip] = React.useState(false);
  const { t } = useTranslation();
  const priority = screening.screening.priority;
  let priorityLabel = '';
  let priorityColor = '';
  if (priority === 'strongly_recommended') {
    priorityLabel = 'موصى به بشدة';
    priorityColor = '#6B7280'; // grey
  } else if (priority === 'recommended') {
    priorityLabel = 'موصى به';
    priorityColor = '#9CA3AF'; // lighter grey
  }
  // Translate and color the status label for each status
  let statusLabel = screening.status;
  let statusLabelStyle = [styles.screeningStatus];
  if (screening.status === 'later' || screening.status === 'laterRecreated') {
    if (screening.status === 'laterRecreated' && screening.nextDue) {
      statusLabel = t('home.later');
      const nextAppointmentText = t('screening.NextOPD', { date: new Date(screening.nextDue).toLocaleDateString('en-GB') });
      statusLabelStyle = [
        styles.screeningStatus,
        {
          color: '#f59e42',
          backgroundColor: '#fff7ed',
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 2,
          alignSelf: 'flex-end',
          overflow: 'hidden',
          fontWeight: 'bold',
        } as any,
      ];
      return (
        <View style={[styles.screeningCard, { flexDirection: 'row', position: 'relative' }]}> 
          {/* Priority tag in top left corner */}
          {priority && (
            <View style={{
              position: 'absolute',
              top: 8,
              left: 8,
              zIndex: 2,
              backgroundColor: priorityColor,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 3,
              alignSelf: 'flex-start',
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', fontFamily: 'ReadexPro-Bold' }}>{priorityLabel}</Text>
            </View>
          )}
          {/* Buttons on the left */}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity style={styles.actionButton} onPress={onSchedule}>
              <Text style={styles.actionButtonText}>أحجز مع صحتي</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onMarkCompleted}>
              <Text style={styles.actionButtonText}>تم</Text>
            </TouchableOpacity>
          </View>
          {/* Details on the right, aligned right */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {/* Name row: info icon, name */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {screening.screening?.description ? (
                <Tooltip
                  isVisible={showTip}
                  content={<Text style={{ maxWidth: 200 }}>{screening.screening.description}</Text>}
                  placement="top"
                  onClose={() => setShowTip(false)}
                  showChildInTooltip={false}
                  backgroundColor="rgba(0,0,0,0.2)"
                >
                  <TouchableOpacity onPress={() => setShowTip(true)} style={{ marginLeft: 4 }}>
                    <MaterialCommunityIcons name="information-outline" size={18} color="#4CCCE6" />
                  </TouchableOpacity>
                </Tooltip>
              ) : null}
              <Text style={styles.screeningTitle}>{screening.screening.name}</Text>
            </View>
            {/* Status label below name row */}
            <View style={{ width: '100%', marginTop: 4, alignItems: 'flex-end' }}>
              <View>
                <Text style={[...statusLabelStyle, { textAlign: 'right', alignSelf: 'flex-end' }]}>{statusLabel}</Text>
              </View>
            </View>
            {/* Next appointment date for recreated tests */}
            <Text style={{ color: '#fff', fontSize: 14, marginBottom: 2, textAlign: 'right', fontWeight: 'bold', fontFamily: 'ReadexPro-Bold' }}>
              {nextAppointmentText}
            </Text>
            {/* Repetition frequency */}
            {typeof screening.screening?.frequencyYears === 'number' && (
              <Text style={{ color: '#fff', fontSize: 13, marginTop: 2, marginBottom: 2, fontFamily: 'ReadexPro' }}>
                {getFrequencyText(screening.screening.frequencyYears)}
              </Text>
            )}
          </View>
        </View>
      );
    } else {
      statusLabel = t('home.later');
    }
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: '#f59e42',
        backgroundColor: '#fff7ed',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-end',
        overflow: 'hidden',
        fontWeight: 'bold',
      } as any,
    ];
  } else if (screening.status === 'due') {
    statusLabel = 'حالاً';
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: '#2563eb', // blue-600
        backgroundColor: '#eff6ff', // blue-50
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-end',
        overflow: 'hidden',
        fontWeight: 'bold',
      } as any,
    ];
  } else if (screening.status === 'overdue') {
    statusLabel = 'متأخر';
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: '#dc2626', // red-600
        backgroundColor: '#fef2f2', // red-50
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-end',
        overflow: 'hidden',
        fontWeight: 'bold',
      } as any,
    ];
  } else if (screening.status === 'completed') {
    statusLabel = 'مكتمل';
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: '#22c55e', // green-600
        backgroundColor: '#f0fdf4', // green-50
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-end',
        overflow: 'hidden',
        fontWeight: 'bold',
      } as any,
    ];
  }
  // Add language detection (for i18n)
  const language = isRTL ? 'ar' : 'en';
  // Calculate overdue years if needed
  let overdueYears: number | null = null;
  if (screening.status === 'overdue' && screening.screening?.startAge && userBirthDate) {
    const birthDate = new Date(userBirthDate);
    const birthYear = birthDate.getFullYear();
    const targetYear = birthYear + screening.screening.startAge;
    const currentYear = new Date().getFullYear();
    overdueYears = currentYear - targetYear;
  }
  return (
    <View style={[styles.screeningCard, { flexDirection: 'row', position: 'relative' }]}> 
      {/* Priority tag in top left corner */}
      {priority && (
        <View style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 2,
          backgroundColor: priorityColor,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 3,
          alignSelf: 'flex-start',
        }}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold', fontFamily: 'ReadexPro-Bold' }}>{priorityLabel}</Text>
        </View>
      )}
      {/* Buttons on the left */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity style={styles.actionButton} onPress={onSchedule}>
          <Text style={styles.actionButtonText}>أحجز مع صحتي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onMarkCompleted}>
          <Text style={styles.actionButtonText}>تم</Text>
        </TouchableOpacity>
      </View>
      {/* Details on the right, aligned right */}
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {/* Name row: info icon, name */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {screening.screening?.description ? (
            <Tooltip
              isVisible={showTip}
              content={<Text style={{ maxWidth: 200 }}>{screening.screening.description}</Text>}
              placement="top"
              onClose={() => setShowTip(false)}
              showChildInTooltip={false}
              backgroundColor="rgba(0,0,0,0.2)"
            >
              <TouchableOpacity onPress={() => setShowTip(true)} style={{ marginLeft: 4 }}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#4CCCE6" />
              </TouchableOpacity>
            </Tooltip>
          ) : null}
          <Text style={styles.screeningTitle}>{screening.screening.name}</Text>
        </View>
        {/* Status label below name row */}
        <View style={{ width: '100%', marginTop: 4, alignItems: 'flex-end' }}>
          <View>
            <Text style={[...statusLabelStyle, { textAlign: 'right', alignSelf: 'flex-end' }]}>{statusLabel}</Text>
          </View>
        </View>
        {/* Repetition date below status */}
        {(screening.status === 'completed' || screening.status === 'due' || (screening.status !== 'overdue' && screening.status !== 'completed' && screening.status !== 'due')) && typeof screening.screening?.frequencyYears === 'number' && (
          <Text style={{ color: '#fff', fontSize: 13, marginTop: 2, marginBottom: 2, fontFamily: 'ReadexPro' }}>
            {getFrequencyText(screening.screening.frequencyYears)}
          </Text>
        )}
        {/* Next due message (only for original later, not recreated) */}
        {screening.status === 'later' && typeof screening.screening?.startAge === 'number' && userBirthDate && (
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 2, textAlign: 'right', fontFamily: 'ReadexPro' }}>
            {t('screening.takeAtAge', { age: screening.screening.startAge })}
          </Text>
        )}
        {/* Overdue years label */}
        {screening.status === 'overdue' && overdueYears !== null && overdueYears > 0 && (
          <Text style={{ color: '#fff', fontSize: 14, marginBottom: 2, textAlign: 'right', fontFamily: 'ReadexPro' }}>
            {`متأخر ${overdueYears} ${overdueYears === 1 ? 'سنة' : overdueYears < 11 ? 'سنوات' : 'سنة'}`}
          </Text>
        )}
      </View>
    </View>
  );
};

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

function calculateScreeningStats(screenings: ScreeningWithDetails[]) {
  const stats = { due: 0, overdue: 0, later: 0, completed: 0 };
  screenings.forEach((s) => {
    if (s.status === 'due') stats.due++;
    else if (s.status === 'overdue') stats.overdue++;
    else if (s.status === 'later') stats.later++;
    else if (s.status === 'completed') stats.completed++;
  });
  return stats;
}

function filterScreeningsByStatus(screenings: ScreeningWithDetails[], status: string) {
  if (status === 'all') {
    // For 'all' status, show all screenings except completed non-repeatable ones
    return screenings.filter(s => {
      if (s.status !== 'completed') return true;
      // For completed screenings, only show repeatable ones with a next due date
      return s.screening.frequencyYears > 0 && s.nextDue;
    });
  }
  return screenings.filter(s => s.status === status);
}

// Add sorting function for screenings
function sortScreenings(screenings: ScreeningWithDetails[]) {
  const statusOrder = { due: 1, overdue: 2, later: 0 };
  return [...screenings].sort((a, b) => {
    // First sort by status
    const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] || 3) - 
                      (statusOrder[b.status as keyof typeof statusOrder] || 3);
    if (statusDiff !== 0) return statusDiff;
    
    // Then sort by name
    return (a.screening.name || '').localeCompare(b.screening.name || '');
  });
}

export default function UpcomingTests() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { selectedPersonId, setSelectedPersonId } = useContext(SelectedPersonContext);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);

  // Get initial tab from route params
  useEffect(() => {
    if (params?.initialTab) {
      setActiveTab(params.initialTab as string);
    }
  }, [params.initialTab]);

  // Load userId from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('healthscreen_user_id').then((id) => {
      if (id) setUserId(id);
      else router.replace('/onboarding');
    });
  }, []);

  // Data fetching
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest('GET', `/api/users/${userId}`),
    enabled: !!userId,
  });

  const { data: familyMembersData } = useQuery({
    queryKey: ['/api/users', userId, 'family'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/family`),
    enabled: !!userId,
  });

  const { data: selectedPersonData, isLoading: isLoadingSelectedPerson, error: selectedPersonError } = useQuery({
    queryKey: ['selectedPerson', selectedPersonId, userId],
    queryFn: () =>
      selectedPersonId === 'user'
        ? apiRequest('GET', `/api/users/${userId}`)
        : apiRequest('GET', `/api/family/${selectedPersonId}/screenings`),
    enabled: !!userId && !!selectedPersonId && (
      selectedPersonId === "user" || 
      (Array.isArray(familyMembersData) && familyMembersData.some((member: any) => member.id.toString() === selectedPersonId))
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
      setSelectedPersonId('user');
      AsyncStorage.setItem('selectedPersonId', 'user');
    }
  }, [selectedPersonError]);

  // Validate selected person when family members data changes
  useEffect(() => {
    if (Array.isArray(familyMembersData) && selectedPersonId !== 'user') {
      const familyMemberExists = familyMembersData.some((member: any) => member.id.toString() === selectedPersonId);
      if (!familyMemberExists) {
        console.log('Selected family member no longer exists, switching to user');
        setSelectedPersonId('user');
        AsyncStorage.setItem('selectedPersonId', 'user');
      }
    }
  }, [familyMembersData, selectedPersonId]);

  // Mutations
  const markCompletedMutation = useMutation({
    mutationFn: async (screening: any) => {
      const now = new Date();
      const nextDue = new Date();
      nextDue.setFullYear(nextDue.getFullYear() + (screening.screening?.frequencyYears || 1));
      if (selectedPersonId !== 'user') {
        return apiRequest('POST', `/api/family/${selectedPersonId}/screenings/${screening.screeningId}/complete`, {
          lastCompleted: now.toISOString(),
          nextDue: nextDue.toISOString(),
          status: 'completed',
        });
      } else {
        return apiRequest('PUT', `/api/user-screenings/${screening.id}`, {
          lastCompleted: now.toISOString(),
          nextDue: nextDue.toISOString(),
          status: 'completed',
        });
      }
    },
    onSuccess: async (data, screening) => {
      queryClient.invalidateQueries();
      showToast({ title: 'تم تحديث الفحص', type: 'success' });
    },
    onError: (error: any) => {
      showToast({ title: 'خطأ', description: error.message || 'حدث خطأ', type: 'error' });
    },
  });

  const handleMarkCompleted = (screening: ScreeningWithDetails) => {
    markCompletedMutation.mutate(screening);
  };

  const handleScheduleScreening = async (screening: ScreeningWithDetails) => {
    const sehhatyAppStoreUrl = 'https://apps.apple.com/sa/app/%D8%B5%D8%AD%D8%AA%D9%8A-sehhaty/id1459266578?l';
    try {
      const supported = await Linking.canOpenURL(sehhatyAppStoreUrl);
      if (supported) {
        await Linking.openURL(sehhatyAppStoreUrl);
      } else {
        showToast({ 
          title: 'خطأ', 
          description: 'لا يمكن فتح رابط التطبيق', 
          type: 'error' 
        });
      }
    } catch (error) {
      showToast({ 
        title: 'خطأ', 
        description: 'حدث خطأ أثناء فتح التطبيق', 
        type: 'error' 
      });
    }
  };

  // Data normalization
  let familyMembers: any[] = Array.isArray(familyMembersData) ? familyMembersData : [];
  let currentPerson: { name?: string; dateOfBirth: string; gender: string } = { dateOfBirth: '', gender: '' };
  let screenings: ScreeningWithDetails[] = [];

  if (selectedPersonData && typeof selectedPersonData === 'object' && selectedPersonData !== null) {
    if (selectedPersonId === 'user' && 'user' in selectedPersonData && 'screenings' in selectedPersonData) {
      const userResponse = selectedPersonData as UserDataResponse;
      currentPerson = userResponse.user;
      screenings = userResponse.screenings;
    } else if ('familyMember' in selectedPersonData && 'screenings' in selectedPersonData) {
      const familyResponse = selectedPersonData as FamilyMemberResponse;
      currentPerson = {
        name: familyResponse.familyMember.name,
        dateOfBirth: familyResponse.familyMember.dateOfBirth,
        gender: familyResponse.familyMember.gender,
      };
      screenings = familyResponse.screenings;
    }
  }

  const currentPersonAge = currentPerson.dateOfBirth ? calculateAge(currentPerson.dateOfBirth) : '';
  const currentPersonName = currentPerson.name || 'أنت';
  const currentPersonGender = currentPerson.gender || '';
  const stats = calculateScreeningStats(screenings);

  // Tabs logic
  const tabOptions = [
    { key: 'all', label: 'الكل', color: undefined },
    { key: 'due', label: 'حالاً', color: STATUS_COLORS.due },
    { key: 'overdue', label: 'متأخر', color: STATUS_COLORS.overdue },
    { key: 'later', label: 'لاحقاً', color: STATUS_COLORS.later },
    //{ key: 'completed', label: 'مكتملة', color: STATUS_COLORS.completed },
  ];

  let filteredScreenings = screenings;
  if (activeTab === 'all') {
    // Only filter out completed screenings that are not repeatable
    filteredScreenings = screenings.filter((s) => {
      // Keep the screening if it's not completed
      if (s.status !== 'completed') return true;
      // For completed screenings, only keep them if they are repeatable and have a next due date
      return s.screening.frequencyYears > 0 && s.nextDue;
    });
    filteredScreenings = sortScreenings(filteredScreenings);
  } else if (activeTab !== 'all') {
    filteredScreenings = filterScreeningsByStatus(screenings, activeTab);
  }

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Loading and error states
  if (!userId || isLoading || isLoadingSelectedPerson) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CCCE6" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  if (error) {
    AsyncStorage.removeItem('healthscreen_user_id');
    router.replace('/onboarding');
    return null;
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#202221' }} 
      contentContainerStyle={{ paddingBottom: 32 }} 
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
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#202221', '#272A29'] : ['#003848', '#4CCCE6']}
        style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}
      >
        <Text style={styles.headerTitle}>{selectedPersonId === 'user' ? `مرحباً، ${currentPersonName}` : `فحوصات ${currentPersonName}`}</Text>
        <Text style={styles.headerSubtitle}>{`العمر: ${currentPersonAge} • ${currentPersonGender === 'male' ? 'ذكر' : 'أنثى'}`}</Text>
        {/* Family selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.familySelector}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 8, flexDirection: 'row-reverse', alignItems: 'center' }}
        >
          <TouchableOpacity
            style={[styles.familyButton, selectedPersonId === 'user' && styles.familyButtonSelected]}
            onPress={() => setSelectedPersonId('user')}
          >
            <Text style={[styles.familyButtonText, selectedPersonId === 'user' && styles.familyButtonSelectedText]}>أنت</Text>
          </TouchableOpacity>
          {familyMembers.map((member: any) => (
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

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabOptions.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && tab.color && {
              backgroundColor: tab.color.background,
              borderColor: tab.color.border,
              borderWidth: 1,
            }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabButtonText, activeTab === tab.key && tab.color && { color: tab.color.text, fontWeight: 'bold' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Screenings List */}
      <ScrollView style={styles.screeningsList} contentContainerStyle={{ gap: 7, paddingBottom: 32 }}>
        {filteredScreenings.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد فحوصات في هذا القسم</Text>
        ) : (
          filteredScreenings.map((screening, index) => (
            <ScreeningCard
              key={screening.id !== 0 ? screening.id : `${screening.screening.name}-${index}`}
              screening={screening}
              onSchedule={() => handleScheduleScreening(screening)}
              onMarkCompleted={() => handleMarkCompleted(screening)}
              isRTL={isRTL}
              userBirthDate={currentPerson.dateOfBirth}
            />
          ))
        )}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202221',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202221',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#045468',
  },
  header: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    minHeight: 160,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'ReadexPro-Bold',
  },
  headerSubtitle: {
    color: '#e0ffe0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'right',
    fontFamily: 'ReadexPro-Bold',
  },
  familySelector: {
    marginTop: 8,
    marginBottom: 8,
  },
  familyButton: {
    backgroundColor: '#2E3130',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#045468',
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
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#202221',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#2E3130',
  },
  tabButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'ReadexPro-Bold',
  },
  screeningsList: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 32,
    fontFamily: 'ReadexPro',
  },
  screeningCard: {
    backgroundColor: '#2E3130',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  screeningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'ReadexPro-Bold',
  },
  screeningStatus: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'ReadexPro',
  },
  actionButton: {
    backgroundColor: '#045468',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'ReadexPro-Bold',
  },
}); 