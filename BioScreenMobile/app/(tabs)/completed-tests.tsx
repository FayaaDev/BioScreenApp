import { useEffect, useState, useContext, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
} from 'react-native';
import { View, Text, Card, Button, TouchableOpacity, LoaderScreen, Colors } from 'react-native-ui-lib';
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
import { medicalStorage } from '../../lib/medical-storage';

// Types
type Screening = {
  id: string;
  status: string;
  testName?: string;
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
const ScreeningCard = ({ screening, isRTL, userBirthDate, styles }: {
  screening: Screening;
  isRTL: boolean;
  userBirthDate: string;
  styles: any;
}) => {
  const [showTip, setShowTip] = useState(false);
  const { t } = useTranslation();
  // Always show 'Done' with green pill in Completed Tests
  const statusLabel = t('home.statusTabs.done');
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

  const screeningName = screening.testName || screening.screening?.name || screening.name || "Unknown Screening";
  const description = screening.screening?.description;

  return (
    <Card
      backgroundColor={Colors.card}
      enableShadow
      elevation={3}
      style={[styles.screeningCard, { flexDirection: 'row' }]}
    >
      {/* Details aligned right */}
      <View style={{ flex: 1, alignItems: 'flex-start' }}>
        {/* Name row: info icon, name */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.screeningTitle}>{screeningName}</Text>
          {description ? (
            <Tooltip
              isVisible={showTip}
              content={<Text style={{ maxWidth: 200, fontFamily: 'ReadexPro' }}>{description}</Text>}
              placement="top"
              onClose={() => setShowTip(false)}
              showChildInTooltip={false}
              backgroundColor={Colors.overlay}
            >
              <TouchableOpacity onPress={() => setShowTip(true)} style={{ marginStart: 8 }}>
                <MaterialCommunityIcons name="information-outline" size={18} color={Colors.primary} />
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

  // Fetch user profile and family members
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await medicalStorage.getUserProfile(userId);
    },
    enabled: !!userId,
  });

  const { data: familyMembersList } = useQuery({
    queryKey: ["familyMembers", userId],
    queryFn: async () => {
      if (!userId) return [];
      return await medicalStorage.getFamilyMembers(userId);
    },
    enabled: !!userId,
  });

  // Fetch screenings
  const { data: screeningsData } = useQuery({
    queryKey: ["screenings", userId, selectedPersonId],
    queryFn: async () => {
      if (!userId) return [];
      if (selectedPersonId === "user") {
        return await medicalStorage.getUserScreenings(userId);
      } else {
        return await medicalStorage.getFamilyMemberScreenings(userId, selectedPersonId);
      }
    },
    enabled: !!userId,
  });

  // Determine current person data
  let currentPerson: any = {
    name: t("common.you"),
    dateOfBirth: "",
    gender: "",
    height: "",
    weight: "",
    medicalConditions: [],
  };

  if (selectedPersonId === "user" && userProfile) {
    currentPerson = {
      ...userProfile,
      name: t("common.you"),
    };
  } else if (selectedPersonId !== "user" && familyMembersList) {
    const member = familyMembersList.find((m) => m.id === selectedPersonId);
    if (member) {
      currentPerson = member;
    }
  }

  const familyMembers = familyMembersList || [];
  const screenings: any[] = screeningsData || [];

  const currentPersonAge = currentPerson.dateOfBirth ? calculateAge(currentPerson.dateOfBirth) : '';
  const currentPersonName = currentPerson.name || t('common.you');
  const currentPersonGender = currentPerson.gender || '';

  // Calculate BMI
  const calculateBMI = (height: string, weight: string) => {
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w) return null;
    return (w / (h * h)).toFixed(1);
  };

  const bmi = calculateBMI(currentPerson.height, currentPerson.weight);

  const getBMICategory = (bmiValue: string) => {
    const bmi = parseFloat(bmiValue);
    if (bmi < 18.5) return t("family.bmiCategory.underweight");
    if (bmi < 25) return t("family.bmiCategory.normal");
    if (bmi < 30) return t("family.bmiCategory.overweight");
    return t("family.bmiCategory.obese");
  };

  const completedScreenings = filterScreeningsByStatus(screenings, 'completed');

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
      color: Colors.text,
      marginBottom: 4,
      fontFamily: 'ReadexPro-Bold',
    },
    screeningStatus: { fontSize: 14, color: Colors.textSecondary, fontFamily: 'ReadexPro' },
    actionButton: {
      backgroundColor: Colors.error,
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
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    familyButtonSelected: {
      backgroundColor: Colors.white,
      borderColor: Colors.white,
    },
    familyButtonText: {
      color: Colors.white,
      fontWeight: 'bold' as const,
      fontFamily: 'ReadexPro-Bold',
    },
    familyButtonSelectedText: {
      color: Colors.primary,
    },
  };

  // Loading and error states
  if (!userId) {
    return (
      <LoaderScreen color={Colors.primary} message={t('common.loading')} backgroundColor={Colors.background} />
    );
  }

  const getConditionTranslationKey = (condition: string): string => {
    const map: { [key: string]: string } = {
      'قلة النشاط البدني': 'physicalInactivity',
      'تدخين التبغ': 'tobaccoSmoking',
      'مرض ارتفاع ضغط الدم': 'hypertension',
      'داء السكري': 'diabetes',
      'تاريخ لمرض قلبي وعائي': 'cardiovascularHistory',
      'مرض عضوي مزمن': 'chronicOrganDisease',
      'قراءات مرتفعة لضغط الدم': 'highBloodPressureReadings',
      'تاريخ عائلي للسكري': 'familyDiabetesHistory',
      'تاريخ لسكري الحمل': 'gestationalDiabetesHistory',
      'تاريخ جنسي': 'sexualHistory'
    };
    return map[condition] || condition;
  };

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
          colors={[Colors.primary]} // Android
          tintColor={Colors.primary} // iOS
          title={t('common.refreshing')} // iOS
          titleColor={Colors.primary} // iOS
        />
      }
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? [Colors.background, Colors.card]
            : [Colors.primary, Colors.primary]
        }
        style={[
          styles.header,
          { paddingTop: insets.top + 16, paddingBottom: 16 },
        ]}
      >
        <View style={{ width: '100%' }}>
          <View style={{ width: '100%', gap: 12 }}>
            {/* Gender Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: Colors.white, fontFamily: 'ReadexPro', fontSize: 14 }}>
                {t("profile.gender")}:
              </Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: Colors.white, fontFamily: 'ReadexPro-Bold', fontSize: 14 }}>
                  {currentPersonGender === "male" ? t("common.male") : t("common.female")}
                </Text>
              </View>
            </View>

            {/* Age Row */}
            {currentPersonAge !== "" && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.white, fontFamily: 'ReadexPro', fontSize: 14 }}>
                  {t("profile.age")}:
                </Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: Colors.white, fontFamily: 'ReadexPro-Bold', fontSize: 14 }}>
                    {currentPersonAge} {t("common.years")}
                  </Text>
                </View>
              </View>
            )}

            {/* BMI Row */}
            {bmi && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.white, fontFamily: 'ReadexPro', fontSize: 14 }}>
                  {t("family.bmi")}:
                </Text>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: Colors.white, fontFamily: 'ReadexPro-Bold', fontSize: 14 }}>
                    {bmi} ({getBMICategory(bmi)})
                  </Text>
                </View>
              </View>
            )}

            {/* Medical Conditions Row */}
            {currentPerson.medicalConditions && currentPerson.medicalConditions.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.white, fontFamily: 'ReadexPro', fontSize: 14, marginTop: 6 }}>
                  {t("family.medicalConditions")}:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', flex: 1, marginLeft: 16 }}>
                  {currentPerson.medicalConditions.map((condition: string, index: number) => {
                    const translationKey = getConditionTranslationKey(condition);
                    return (
                      <View key={index} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: Colors.white, fontFamily: 'ReadexPro-Bold', fontSize: 12 }}>
                          {t(`family.conditions.${translationKey}`, { defaultValue: condition })}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
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
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={[
              styles.familyButton,
              selectedPersonId === "user" && styles.familyButtonSelected,
            ]}
            onPress={() => setSelectedPersonId("user")}
          >
            <Text
              style={[
                styles.familyButtonText,
                selectedPersonId === "user" && styles.familyButtonSelectedText,
              ]}
            >
              {t("common.you")}
            </Text>
          </TouchableOpacity>
          {familyMembers.map((member: any) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.familyButton,
                selectedPersonId === member.id.toString() &&
                styles.familyButtonSelected,
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
                {member.relationship ? t(`family.relationships.${member.relationship}`, { defaultValue: member.relationship }) : (member.name || "Member")}
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
                key={screening.id !== "0" ? screening.id : `${screening.testName || screening.name}-${index}`}
                screening={screening}
                isRTL={isRTL}
                userBirthDate={currentPerson.dateOfBirth}
                styles={styles}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
