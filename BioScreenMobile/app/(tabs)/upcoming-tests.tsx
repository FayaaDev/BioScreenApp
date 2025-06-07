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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useRouter } from 'expo-router';
import { STATUS_COLORS } from '../../lib/screening-utils';
import Tooltip from 'react-native-walkthrough-tooltip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { ScreeningCard } from '../../components/ScreeningCard'; // Placeholder below

type Screening = {
  id: number;
  status: string;
  screening?: { name: string; frequencyYears?: number; description?: string; priority?: string };
  name?: string;
};

type UserDataResponse = {
  user: { name?: string; dateOfBirth: string; gender: string };
  screenings: Screening[];
};

type FamilyMemberResponse = {
  familyMember: { name: string; dateOfBirth: string; gender: string };
  screenings: Screening[];
};

// Placeholder for ScreeningCard
const ScreeningCard = ({ screening, onSchedule, onMarkCompleted, isRTL, userBirthDate }: {
  screening: Screening;
  onSchedule: () => void;
  onMarkCompleted: () => void;
  isRTL: boolean;
  userBirthDate: string;
}) => {
  const [showTip, setShowTip] = React.useState(false);
  const priority = screening.screening?.priority;
  let priorityLabel = '';
  let priorityColor = '';
  if (priority === 'strongly_recommended') {
    priorityLabel = 'موصى به بشدة';
    priorityColor = '#ef4444'; // red-500
  } else if (priority === 'recommended') {
    priorityLabel = 'موصى به';
    priorityColor = '#fca5a5'; // red-300
  }
  // Translate and color the status label for each status
  let statusLabel = screening.status;
  let statusLabelStyle = [styles.screeningStatus];
  if (screening.status === 'later') {
    statusLabel = 'لاحقاً';
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
    statusLabel = 'مستحقة';
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
    statusLabel = 'متأخرة';
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
    statusLabel = 'مكتملة';
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: '#16a34a', // green-600
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
  return (
    <View style={[styles.screeningCard, { flexDirection: 'row' }]}> 
      {/* Buttons on the left */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity style={styles.actionButton} onPress={onSchedule}>
          <Text style={styles.actionButtonText}>جدولة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onMarkCompleted}>
          <Text style={styles.actionButtonText}>تم</Text>
        </TouchableOpacity>
      </View>
      {/* Details on the right, aligned right */}
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {/* Name row: priority badge, info icon, name */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {priority && (
            <View style={{
              backgroundColor: priorityColor,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 3,
              marginLeft: 6,
              alignSelf: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{priorityLabel}</Text>
            </View>
          )}
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
                <MaterialCommunityIcons name="information-outline" size={18} color="#008553" />
              </TouchableOpacity>
            </Tooltip>
          ) : null}
          <Text style={styles.screeningTitle}>{screening.screening?.name || screening.name}</Text>
        </View>
        {/* Status label below name row */}
        <View style={{ width: '100%', marginTop: 4, alignItems: 'flex-end' }}>
          <View>
            <Text style={[...statusLabelStyle, { textAlign: 'right', alignSelf: 'flex-end' }]}>{statusLabel}</Text>
          </View>
        </View>
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

function calculateScreeningStats(screenings: any[]) {
  const stats = { due: 0, overdue: 0, later: 0, completed: 0 };
  screenings.forEach((s) => {
    if (s.status === 'due') stats.due++;
    else if (s.status === 'overdue') stats.overdue++;
    else if (s.status === 'later') stats.later++;
    else if (s.status === 'completed') stats.completed++;
  });
  return stats;
}

function filterScreeningsByStatus(screenings: any[], status: string) {
  return screenings.filter((s) => s.status === status);
}

export default function UpcomingTests() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPersonId, setSelectedPersonId] = useState('user');
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  // Load userId from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('healthscreen_user_id').then((id) => {
      if (id) setUserId(id);
      else router.replace('/onboarding');
    });
    AsyncStorage.getItem('selectedPersonId').then((id) => {
      if (id) setSelectedPersonId(id);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('selectedPersonId', selectedPersonId);
  }, [selectedPersonId]);

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

  const { data: selectedPersonData, isLoading: isLoadingSelectedPerson } = useQuery({
    queryKey: ['selectedPerson', selectedPersonId, userId],
    queryFn: () =>
      selectedPersonId === 'user'
        ? apiRequest('GET', `/api/users/${userId}`)
        : apiRequest('GET', `/api/family/${selectedPersonId}/screenings`),
    enabled: !!userId && !!selectedPersonId,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast({ title: 'تم تحديث الفحص', type: 'success' });
    },
    onError: (error: any) => {
      showToast({ title: 'خطأ', description: error.message || 'حدث خطأ', type: 'error' });
    },
  });

  const handleMarkCompleted = (screening: any) => {
    markCompletedMutation.mutate(screening);
  };

  const handleScheduleScreening = (screening: any) => {
    showToast({ title: 'جدولة موعد', description: `سيتم جدولة ${screening.screening?.name || screening.name}`, type: 'info' });
  };

  // Data normalization
  let familyMembers: any[] = Array.isArray(familyMembersData) ? familyMembersData : [];
  let currentPerson: { name?: string; dateOfBirth: string; gender: string } = { dateOfBirth: '', gender: '' };
  let screenings: Screening[] = [];

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
    { key: 'due', label: 'مستحقة', color: STATUS_COLORS.due },
    { key: 'overdue', label: 'متأخرة', color: STATUS_COLORS.overdue },
    { key: 'later', label: 'لاحقاً', color: STATUS_COLORS.later },
    { key: 'completed', label: 'مكتملة', color: STATUS_COLORS.completed },
  ];

  let filteredScreenings = screenings;
  if (activeTab === 'all') {
    filteredScreenings = screenings.filter((s) => s.status !== 'completed');
  } else if (activeTab !== 'all') {
    filteredScreenings = filterScreeningsByStatus(screenings, activeTab);
  }

  // Loading and error states
  if (!userId || isLoading || isLoadingSelectedPerson) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#008553" />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fffe' }}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 32 }]}>
        <Text style={styles.headerTitle}>{selectedPersonId === 'user' ? `مرحباً، ${currentPersonName}` : `فحوصات ${currentPersonName}`}</Text>
        <Text style={styles.headerSubtitle}>{`العمر: ${currentPersonAge} • ${currentPersonGender === 'male' ? 'ذكر' : 'أنثى'}`}</Text>
        {/* Family selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.familySelector} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            style={[styles.familyButton, selectedPersonId === 'user' && styles.familyButtonSelected]}
            onPress={() => setSelectedPersonId('user')}
          >
            <Text style={styles.familyButtonText}>أنت</Text>
          </TouchableOpacity>
          {familyMembers.map((member: any) => (
            <TouchableOpacity
              key={member.id}
              style={[styles.familyButton, selectedPersonId === member.id.toString() && styles.familyButtonSelected]}
              onPress={() => setSelectedPersonId(member.id.toString())}
            >
              <Text style={styles.familyButtonText}>{member.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats.due}</Text><Text style={styles.statLabel}>مستحقة</Text></View>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats.overdue}</Text><Text style={styles.statLabel}>متأخرة</Text></View>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats.later}</Text><Text style={styles.statLabel}>لاحقاً</Text></View>
        <View style={styles.statBox}><Text style={styles.statNumber}>{stats.completed}</Text><Text style={styles.statLabel}>مكتملة</Text></View>
      </View>

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
      <ScrollView style={styles.screeningsList} contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        {filteredScreenings.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد فحوصات في هذا القسم</Text>
        ) : (
          filteredScreenings.map((screening, index) => (
            <ScreeningCard
              key={screening.id !== 0 ? screening.id : `${screening.screening?.name || screening.name}-${index}`}
              screening={screening}
              onSchedule={() => handleScheduleScreening(screening)}
              onMarkCompleted={() => handleMarkCompleted(screening)}
              isRTL={isRTL}
              userBirthDate={currentPerson.dateOfBirth}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#008553',
  },
  header: {
    padding: 16,
    backgroundColor: '#008553',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  headerSubtitle: {
    color: '#e0ffe0',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'right',
  },
  familySelector: {
    marginTop: 8,
    marginBottom: 8,
  },
  familyButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#008553',
  },
  familyButtonSelected: {
    backgroundColor: '#008553',
    borderColor: '#008553',
  },
  familyButtonText: {
    color: '#008553',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008553',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fffe',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#fff',
  },
  tabButtonText: {
    color: '#008553',
    fontWeight: 'bold',
  },
  screeningsList: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 32,
  },
  screeningCard: {
    backgroundColor: '#fff',
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
    color: '#008553',
    marginBottom: 4,
  },
  screeningStatus: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    backgroundColor: '#008553',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 