import React, { useEffect, useState, useContext } from 'react';
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
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useRouter } from 'expo-router';
import Tooltip from 'react-native-walkthrough-tooltip';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SelectedPersonContext } from '../../context/SelectedPersonContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../../hooks/useColorScheme';

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
const ScreeningCard = ({ screening, isRTL, userBirthDate }: {
  screening: Screening;
  isRTL: boolean;
  userBirthDate: string;
}) => {
  const [showTip, setShowTip] = React.useState(false);
  // Always show 'مكتملة' with green pill in Completed Tests
  const statusLabel = 'تم';
  const statusLabelStyle = [
    styles.screeningStatus,
    {
      color: '#4CCCE6',
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
      {/* Details aligned right */}
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        {/* Name row: info icon, name */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {screening.screening?.description ? (
            <Tooltip
              isVisible={showTip}
              content={<Text style={{ maxWidth: 200, fontFamily: 'ReadexPro' }}>{screening.screening.description}</Text>}
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
  const { selectedPersonId, setSelectedPersonId } = useContext(SelectedPersonContext);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);

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

  // Load userId from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem('healthscreen_user_id').then((id) => {
      if (id) setUserId(id);
      else router.replace('/onboarding');
    });
  }, []);

  // Data fetching
  const { isLoading, error } = useQuery({
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
        style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 10 }]}
      >
        <Text style={styles.headerTitle}>{selectedPersonId === 'user' ? `الفحوصات المكتملة` : `فحوصات ${currentPersonName}`}</Text>
        <Text style={styles.headerSubtitle}>{`العمر: ${currentPersonAge} • ${currentPersonGender === 'male' ? 'ذكر' : 'أنثى'}`}</Text>
        {/* Family selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.familySelector} contentContainerStyle={{ gap: 8 }}>
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

      {/* Completed Screenings List */}
      <View style={styles.screeningsList}>
        {completedScreenings.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد فحوصات مكتملة</Text>
        ) : (
          <View style={{ gap: 7 }}>
            {completedScreenings.map((screening, index) => (
              <ScreeningCard
                key={screening.id !== 0 ? screening.id : `${screening.screening?.name || screening.name}-${index}`}
                screening={screening}
                isRTL={isRTL}
                userBirthDate={currentPerson.dateOfBirth}
              />
            ))}
          </View>
        )}
      </View>
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
    fontFamily: 'ReadexPro',
  },
  header: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
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
    backgroundColor: '#ef4444',
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