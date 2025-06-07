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

// Types
type Screening = {
  id: number;
  status: string;
  screening?: { name: string; frequencyYears?: number; priority?: string; description?: string };
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
const ScreeningCard = ({ screening, onUncomplete, isRTL, userBirthDate }: {
  screening: Screening;
  onUncomplete: () => void;
  isRTL: boolean;
  userBirthDate: string;
}) => {
  const [showTip, setShowTip] = React.useState(false);
  const priority = screening.screening?.priority;
  let priorityLabel = '';
  let priorityColor = '';
  if (priority === 'strongly_recommended') {
    priorityLabel = 'موصى به بشدة';
    priorityColor = '#C2BD86'; //'#ef4444'; // red-500
  } else if (priority === 'recommended') {
    priorityLabel = 'موصى به';
    priorityColor = '#D9D5A8';//'#fca5a5'; // red-300
  }
  // Always show 'مكتملة' with green pill in Completed Tests
  const statusLabel = 'مكتملة';
  const statusLabelStyle = [
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
  return (
    <View style={[styles.screeningCard, { flexDirection: 'row' }]}> 
      {/* Action button on the left */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TouchableOpacity style={styles.actionButton} onPress={onUncomplete}>
          <Text style={styles.actionButtonText}>إرجاع</Text>
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

function filterScreeningsByStatus(screenings: Screening[], status: string) {
  return screenings.filter((s) => s.status === status);
}

export default function CompletedTests() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
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

  // Mutation for uncompleting a screening
  const uncompleteMutation = useMutation({
    mutationFn: async (screening: Screening) => {
      if (selectedPersonId !== 'user') {
        // Use screening.screeningId for family screenings
        const screeningId = (screening as any).screeningId || (screening.screening && (screening.screening as any).id);
        if (!screeningId) throw new Error('معرف الفحص غير موجود');
        return apiRequest('PATCH', `/api/family/${selectedPersonId}/screenings/${screeningId}/uncomplete`, {});
      } else {
        const nextDue = new Date();
        nextDue.setFullYear(nextDue.getFullYear() + (screening.screening?.frequencyYears || 1));
        return apiRequest('PUT', `/api/user-screenings/${screening.id}`, {
          status: 'upcoming',
          lastCompleted: null,
          nextDue: nextDue.toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      showToast({ title: 'تم إرجاع الفحص', type: 'success' });
    },
    onError: (error: any) => {
      showToast({ title: 'خطأ', description: error.message || 'حدث خطأ', type: 'error' });
    },
  });

  const handleUncomplete = (screening: Screening) => {
    uncompleteMutation.mutate(screening);
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
  const completedScreenings = filterScreeningsByStatus(screenings, 'completed');

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
        <Text style={styles.headerTitle}>{selectedPersonId === 'user' ? `الفحوصات المكتملة` : `فحوصات ${currentPersonName}`}</Text>
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

      {/* Completed Screenings List */}
      <ScrollView style={styles.screeningsList} contentContainerStyle={{ gap: 12, paddingBottom: 32 }}>
        {completedScreenings.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد فحوصات مكتملة</Text>
        ) : (
          completedScreenings.map((screening, index) => (
            <ScreeningCard
              key={screening.id !== 0 ? screening.id : `${screening.screening?.name || screening.name}-${index}`}
              screening={screening}
              onUncomplete={() => handleUncomplete(screening)}
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
    backgroundColor: '#ef4444',
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