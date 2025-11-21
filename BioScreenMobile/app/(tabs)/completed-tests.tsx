import { useEffect, useState, useContext, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
} from 'react-native';
import { View, Text, Card, Button, TouchableOpacity, LoaderScreen } from 'react-native-ui-lib';
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
import { useTranslation } from 'react-i18next';

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
  const [showTip, setShowTip] = useState(false);
  const { t } = useTranslation();
  // Always show 'Done' with green pill in Completed Tests
  const statusLabel = t('home.tabs.done');
  const statusLabelStyle = [
    styles.screeningStatus,
    {
      color: Colors.primary,
      backgroundColor: Colors.success + '10', // green-50
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: 'flex-end',
      overflow: 'hidden',
      fontWeight: 'bold',
    } as any,
  ];
  return (
    <Card
      backgroundColor="#2E3130"
      enableShadow
      elevation={3}
      style={[styles.screeningCard, { flexDirection: 'row' }]}
    >
      {/* Details aligned right */}
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        {/* Name row: info icon, name */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.screeningTitle}>{screening.screening?.name || screening.name}</Text>
          {screening.screening?.description ? (
            <Tooltip
              isVisible={showTip}
              content={<Text style={{ maxWidth: 200, fontFamily: 'ReadexPro' }}>{screening.screening.description}</Text>}
              placement="top"
              onClose={() => setShowTip(false)}
              showChildInTooltip={false}
              backgroundColor="rgba(0,0,0,0.2)"
            >
              <TouchableOpacity onPress={() => setShowTip(true)} style={{ marginStart: 8 }}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#4CCCE6" />
              </TouchableOpacity>
            </Tooltip>
          ) : null}
        </View>
        {/* Status label below name row */}
        <View style={{ width: '100%', marginTop: 4, alignItems: 'flex-end' }}>
          <View>
            <Text style={[...statusLabelStyle, { textAlign: 'right', alignSelf: 'flex-end' }]}>{statusLabel}</Text>
          </View>
        </View>
      </View>
    </Card>
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
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedPersonId, setSelectedPersonId } = useContext(SelectedPersonContext);
  const isRTL = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setRefreshKey(prev => prev + 1);
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [i18n]);

  const onRefresh = useCallback(async () => {
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
    AsyncStorage.getItem("local_user_id").then((id) => {
      if (id) {
        setUserId(id);
      } else {
        // Create a new local user ID if it doesn't exist
        const newUserId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        AsyncStorage.setItem("local_user_id", newUserId);
        setUserId(newUserId);
      }
    });
  }, []);

  // Since we're now using local storage only, skip API calls
  const isLoading = false;
  const error = null;
  const familyMembersData = [];
  const selectedPersonData = null;
  const isLoadingSelectedPerson = false;
  const selectedPersonError = null;

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
  const currentPersonName = currentPerson.name || t('common.you');
  const currentPersonGender = currentPerson.gender || '';
  const completedScreenings = filterScreeningsByStatus(screenings, 'completed');

  // Loading and error states
  if (!userId || isLoading || isLoadingSelectedPerson) {
    return (
      <LoaderScreen color="#4CCCE6" message={t('common.loading')} backgroundColor="#202221" />
    );
  }

  // For now, show empty screenings list since we're using local storage
  currentPerson = {
    dateOfBirth: "2000-01-01",
    gender: "male",
    name: currentPersonName,
  };
  screenings = [];

  return (
    <ScrollView 
      key={refreshKey}
      style={{ flex: 1, backgroundColor: Colors.background }} 
      contentContainerStyle={{ paddingBottom: 32 }} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CCCE6']} // Android
          tintColor="#4CCCE6" // iOS
          title={t('common.refreshing')} // iOS
          titleColor="#4CCCE6" // iOS
        />
      }
    >
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#202221', '#272A29'] : ['#003848', '#4CCCE6']}
        style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <View>
            <Text style={styles.headerTitle}>
              {selectedPersonId === 'user'
                ? t('completed.title')
                : t('home.screeningsFor', { name: currentPersonName })}
            </Text>
            <Text style={styles.headerSubtitle}>
              {`${t('profile.age')}: ${currentPersonAge} • ${
                currentPersonGender === 'male' ? t('common.male') : t('common.female')
              }`}
            </Text>
          </View>
        </View>
        {/* Family selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.familySelector}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            style={[
              styles.familyButton,
              selectedPersonId === 'user' && styles.familyButtonSelected,
            ]}
            onPress={() => setSelectedPersonId('user')}
          >
            <Text
              style={[
                styles.familyButtonText,
                selectedPersonId === 'user' && styles.familyButtonSelectedText,
              ]}
            >
              {t('common.you')}
            </Text>
          </TouchableOpacity>
          {familyMembers.map((member: any) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.familyButton,
                selectedPersonId === member.id.toString() && styles.familyButtonSelected,
              ]}
              onPress={() => setSelectedPersonId(member.id.toString())}
            >
              <Text
                style={[
                  styles.familyButtonText,
                  selectedPersonId === member.id.toString() &&
                    styles.familyButtonSelectedText,
                ]}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Completed Screenings List */}
      <View style={styles.screeningsList}>
        {completedScreenings.length === 0 ? (
          <Text style={styles.emptyText}>{t('completed.noCompleted')}</Text>
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

const styles = {
  container: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.primary,
    fontFamily: 'ReadexPro',
  },
  header: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden' as const,
    minHeight: 160,
    alignItems: 'flex-start' as const,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginBottom: 2,
    textAlign: 'left' as const,
    fontFamily: 'ReadexPro-Bold',
  },
  headerSubtitle: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'ReadexPro',
    textAlign: 'left' as const,
  },
  screeningsList: { flex: 1, padding: 16 },
  emptyText: {
    textAlign: 'center' as const,
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 32,
    fontFamily: 'ReadexPro',
  },
  screeningCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    elevation: 2,
  },
  screeningTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
    marginBottom: 4,
    fontFamily: 'ReadexPro-Bold',
  },
  screeningStatus: { fontSize: 14, color: Colors.white, fontFamily: 'ReadexPro' },
  actionButton: {
    backgroundcolor: Colors.error,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  actionButtonText: {
    color: Colors.white,
    fontWeight: 'bold' as const,
    fontFamily: 'ReadexPro-Bold',
  },
  familySelector: {
    marginTop: 8,
    marginBottom: 8,
  },
  familyButton: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    bordercolor: Colors.primary,
  },
  familyButtonSelected: {
    backgroundcolor: Colors.primary,
    bordercolor: Colors.primary,
  },
  familyButtonText: {
    color: Colors.white,
    fontWeight: 'bold' as const,
    fontFamily: 'ReadexPro-Bold',
  },
  familyButtonSelectedText: {
    color: Colors.white,
  },
};
 