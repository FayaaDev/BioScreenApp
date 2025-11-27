import MobileText from '@/components/MobileText';
import React, { useState, useEffect, useContext } from 'react';
import {
  ScrollView,
  RefreshControl,
  I18nManager,
  Dimensions,
} from 'react-native';
import { View, Text, Card, Button, TouchableOpacity, TextField, Modal, LoaderScreen, Colors } from 'react-native-ui-lib';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors as ThemeColors } from '@/constants/Colors';
import { apiRequest } from '@/lib/api';
import { ScreeningWithDetails } from '@/lib/screening-utils';
import { SelectedPersonContext } from '../../context/SelectedPersonContext';
import { medicalStorage, Screening, FamilyMember as StoredFamilyMember } from '@/lib/medical-storage';
import { RecommendationEngine } from '@/lib/recommendationEngine';
import { GroupedRecs, RecCategory, Recommendation } from '@/lib/zimam/types';

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
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [zimamRecommendations, setZimamRecommendations] = useState<GroupedRecs | null>(null);

  const colors = Colors[colorScheme ?? 'light'];

  // Load completed recommendations using React Query for cross-screen sync
  const { data: completedRecommendations = [] } = useQuery<string[]>({
    queryKey: ['completedRecommendations', selectedPersonId],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(`completed_recommendations_${selectedPersonId}`);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading completed recommendations:', error);
        return [];
      }
    },
    enabled: !!selectedPersonId,
  });

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

  // Fetch user profile
  const { data: userProfile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await medicalStorage.getUserProfile(userId);
    },
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Load Zimam recommendations when user profile or selected person changes
  useEffect(() => {
    const loadRecommendations = async () => {
      let profileToEvaluate = null;
      
      if (selectedPersonId === 'user' && userProfile) {
        profileToEvaluate = userProfile;
        setUser(userProfile as unknown as User);
      } else if (selectedPersonId !== 'user' && familyMembersData) {
        const member = familyMembersData.find((m) => m.id === selectedPersonId || m.id?.toString() === selectedPersonId);
        if (member && member.dateOfBirth && member.gender) {
          // Use the family member profile directly (it's already a MedicalProfile)
          profileToEvaluate = member;
        }
      }
      
      if (profileToEvaluate) {
        try {
          const result = await RecommendationEngine.evaluate({ profile: profileToEvaluate });
          setZimamRecommendations(result.groupedRecs);
        } catch (error) {
          console.error('Zimam Engine Error:', error);
          setZimamRecommendations(null);
        }
      } else {
        setZimamRecommendations(null);
      }
    };
    
    loadRecommendations();
  }, [userProfile, selectedPersonId, familyMembersData]);

  // Load screenings from local storage based on selected person
  useEffect(() => {
    const loadScreenings = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let loadedScreenings: Screening[] = [];

        if (selectedPersonId === 'user') {
          loadedScreenings = await medicalStorage.getUserScreenings(userId);
        } else {
          loadedScreenings = await medicalStorage.getFamilyMemberScreenings(userId, selectedPersonId);
        }

        setScreenings(loadedScreenings);
      } catch (error) {
        console.error('Failed to load screenings:', error);
        setScreenings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadScreenings();
  }, [userId, selectedPersonId]);

  // Fetch family members data from local storage
  const { data: familyMembersData } = useQuery<StoredFamilyMember[]>({
    queryKey: ["familyMembers", userId],
    queryFn: async () => {
      if (!userId) return [];
      return await medicalStorage.getFamilyMembers(userId);
    },
    enabled: !!userId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  // Validate selected person when family members data changes
  useEffect(() => {
    if (familyMembersData && Array.isArray(familyMembersData) && selectedPersonId !== "user") {
      const familyMemberExists = familyMembersData.some((member: StoredFamilyMember) => member.id.toString() === selectedPersonId);
      if (!familyMemberExists) {
        console.log('Selected family member no longer exists, switching to user');
        setSelectedPersonId("user");
      }
    }
  }, [familyMembersData, selectedPersonId]);

  // Fetch educational content
  const { data: educationalContent = [] } = useQuery({
    queryKey: ['educational-content'],
    queryFn: async (): Promise<EducationalContent[]> => {
      return apiRequest('GET', '/api/educational-content?isActive=true');
    },
  });

  // Calculate stats from screenings data using the same logic as upcoming tests
  const calculateDashboardStats = (screenings: Screening[]): DashboardStats => {
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
      if (!userId) return;

      // Reload screenings from local storage
      let loadedScreenings: Screening[] = [];

      // Try to sync with backend if it's the main user
      if (selectedPersonId === 'user') {
        try {
          await medicalStorage.fetchAndSyncScreenings(userId);
        } catch (e) {
          console.log('Background sync failed, using local data');
        }
        loadedScreenings = await medicalStorage.getUserScreenings(userId);
      } else {
        loadedScreenings = await medicalStorage.getFamilyMemberScreenings(userId, selectedPersonId);
      }
      setScreenings(loadedScreenings);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userId, selectedPersonId]);

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

  // Get current language for bilingual text
  const { i18n } = useTranslation();
  const currentLang = i18n.language === 'ar' ? 'ar' : 'en';

  if (isLoading && !userId) {
    return (
      <LoaderScreen color={Colors.primary} message={t('common.loading')} backgroundColor={Colors.background} />
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
      style={{ backgroundColor: Colors.background }}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={colorScheme === 'dark' 
          ? ThemeColors.dark.headerGradient 
          : ThemeColors.light.headerGradient
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 2, textAlign: 'left', fontFamily: 'ReadexPro-Bold', color: Colors.white }}>
              {getGreeting()}
            </Text>
            <Text style={{ fontSize: 20, fontFamily: 'ReadexPro', marginBottom: 2, color: Colors.white }}>
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
              {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 20,
                paddingVertical: 8,
                paddingHorizontal: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)'
              },
              selectedPersonId === 'user' && {
                backgroundColor: Colors.white,
                borderColor: Colors.white
              }
            ]}
            onPress={() => setSelectedPersonId('user')}
          >
            <Text style={{
              color: selectedPersonId === 'user' ? Colors.primary : Colors.white,
              fontWeight: 'bold',
              fontFamily: 'ReadexPro-Bold'
            }}>{t('common.you')}</Text>
          </TouchableOpacity>
          {Array.isArray(familyMembersData) && familyMembersData.map((member: StoredFamilyMember) => (
            <TouchableOpacity
              key={member.id}
              style={[
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 20,
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)'
                },
                selectedPersonId === member.id.toString() && {
                  backgroundColor: Colors.white,
                  borderColor: Colors.white
                }
              ]}
              onPress={() => setSelectedPersonId(member.id.toString())}
            >
              <Text style={{
                color: selectedPersonId === member.id.toString() ? Colors.primary : Colors.white,
                fontWeight: 'bold',
                fontFamily: 'ReadexPro-Bold'
              }}>
                {member.relationship ? t(`family.relationships.${member.relationship}`, { defaultValue: member.relationship }) : (member.name || "Member")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Recommendations Summary Cards */}
      {zimamRecommendations && (() => {
        // Define all categories to always show
        const allCategories = [
          { key: 'screening', name: { en: 'Screenings', ar: 'الفحوصات' } },
          { key: 'counseling', name: { en: 'Counselings', ar: 'المشورات' } },
          { key: 'vaccination', name: { en: 'Vaccinations', ar: 'التطعيمات' } },
        ];
        
        // Get count for each category from recommendations (excluding completed)
        const getCategoryCount = (key: string) => {
          const category = zimamRecommendations.groupedRecs.find(cat => cat.key === key);
          if (!category) return 0;
          return category.recs.filter(rec => !completedRecommendations.includes(rec.key)).length;
        };
        
        // Calculate total recommendations
        const totalRecommendations = allCategories.reduce(
          (sum, cat) => sum + getCategoryCount(cat.key),
          0
        ) + completedRecommendations.length;
        
        // Get actual completed count
        const completedCount = completedRecommendations.length;
        
        return (
        <View paddingH-s5 marginB-s5>
          <Text h4 marginB-s4 style={{ textAlign: 'left', color: Colors.text, fontFamily: 'ReadexPro-Bold' }}>
            {currentLang === 'ar' ? 'التوصيات الصحية' : 'Health Recommendations'}
          </Text>
          <View row style={{ justifyContent: 'space-between', gap: 8 }}>
            {/* Completed Card */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() => router.push('/(tabs)/completed-tests')}
            >
              <Card
                paddingV-s4
                paddingH-s1
                center
                backgroundColor={Colors.dashboardCardBackground}
                enableShadow
                elevation={3}
                style={{ height: 110, justifyContent: 'center', borderRadius: 16 }}
              >
                <Text
                  style={{
                    fontSize: 30,
                    fontFamily: 'ReadexPro-Bold',
                    color: Colors.white,
                    marginBottom: 8
                  }}
                >
                  {completedCount}/{totalRecommendations}
                </Text>
                <Text
                  style={{
                    fontFamily: 'ReadexPro-SemiBold',
                    textAlign: 'center',
                    color: Colors.white,
                    fontSize: 9
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {t('home.statusTabs.done')}
                </Text>
              </Card>
            </TouchableOpacity>
            {allCategories.map((category) => {
              // Map category to dashboard status color
              const getCategoryDashboardColor = (key: string) => {
                switch (key) {
                  case 'screening':
                    return Colors.dashboardStatus.due; // Blue
                  case 'counseling':
                    return Colors.dashboardStatus.overdue; // Amber/Yellow
                  case 'vaccination':
                    return Colors.dashboardStatus.completed; // Green
                  default:
                    return Colors.dashboardStatus.later;
                }
              };
              return (
                <TouchableOpacity
                  key={category.key}
                  style={{ flex: 1 }}
                  onPress={() => router.push('/(tabs)/upcoming-tests')}
                >
                  <Card
                    paddingV-s4
                    paddingH-s1
                    center
                    backgroundColor={Colors.dashboardCardBackground}
                    enableShadow
                    elevation={3}
                    style={{ height: 110, justifyContent: 'center', borderRadius: 16 }}
                  >
                    <Text
                      style={{
                        fontSize: 36,
                        fontFamily: 'ReadexPro-Bold',
                        color: getCategoryDashboardColor(category.key),
                        marginBottom: 8
                      }}
                    >
                      {getCategoryCount(category.key)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'ReadexPro-SemiBold',
                        textAlign: 'center',
                        color: Colors.white,
                        fontSize: 9
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {category.name[currentLang]}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        );
      })()}

      {/* Educational Content - Middle Section */}
      <View paddingH-s5 marginB-s8>
        <Text h4 marginB-s4 style={{ textAlign: 'left', color: Colors.text, fontFamily: 'ReadexPro-Bold' }}>
          {t('home.healthTipsTitle')}
        </Text>

        {educationalContent.length > 0 ? (
          <View>
            {educationalContent.slice(0, 3).map((content) => (
              <Card
                key={content.id}
                padding-s5
                marginB-s3
                backgroundColor={Colors.card}
                enableShadow
                elevation={3}
              >
                <Text body style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', marginBottom: 8, color: Colors.text }}>
                  {content.title}
                </Text>
                <Text bodySmall style={{ fontFamily: 'ReadexPro', lineHeight: 20, color: Colors.text }} numberOfLines={4}>
                  {content.content}
                </Text>
              </Card>
            ))}
          </View>
        ) : (
          <Card padding-s5 backgroundColor={Colors.card} enableShadow elevation={3}>
            <MaterialCommunityIcons name="information" size={32} color={Colors.primary} />
            <Text body marginT-s3 marginB-s2 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', color: Colors.text }}>
              {t('home.defaultTipTitle')}
            </Text>
            <Text bodySmall style={{ fontFamily: 'ReadexPro', lineHeight: 20, color: Colors.text }}>
              {t('home.defaultTipContent')}
            </Text>
          </Card>
        )}
      </View>

      {/* Quick Actions - Bottom Section */}
      <View paddingH-s5 marginB-s5>
        <Text h4 marginB-s4 style={{ textAlign: 'left', color: Colors.text, fontFamily: 'ReadexPro-Bold' }}>
          {t('home.quickActionsTitle')}
        </Text>

        <View row style={{ flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
          <TouchableOpacity
            style={{ width: '48%', height: 140 }}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Card padding-s5 center backgroundColor={Colors.card} enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="account-group" size={32} color={Colors.primary} />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: Colors.text }}>
                {t('home.addFamilyTitle')}
              </Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: Colors.text }}>
                {t('home.manageFamilyDesc')}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '48%', height: 140 }}
            onPress={() => router.push('/(tabs)/upcoming-tests')}
          >
            <Card padding-s5 center backgroundColor={Colors.card} enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="calendar-check" size={32} color={Colors.primary} />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: Colors.text }}>
                {t('home.upcomingTestsTitle')}
              </Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: Colors.text }}>
                {t('home.viewScheduledTestsDesc')}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '48%', height: 140 }}
            onPress={() => router.push('/(tabs)/completed-tests')}
          >
            <Card padding-s5 center backgroundColor={Colors.card} enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="clipboard-check" size={32} color={Colors.primary} />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: Colors.text }}>
                {t('home.completedTestsTitle')}
              </Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: Colors.text }}>
                {t('home.viewTestHistoryDesc')}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '48%', height: 140 }}
            onPress={() => setShowContactModal(true)}
          >
            <Card padding-s5 center backgroundColor={Colors.card} enableShadow elevation={3} style={{ height: '100%', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="email" size={32} color={Colors.primary} />
              <Text bodySmall marginT-s3 marginB-4 style={{ fontWeight: 'bold', fontFamily: 'ReadexPro-Bold', textAlign: 'center', color: Colors.text }}>{t('contactUs.title')}</Text>
              <Text caption style={{ fontFamily: 'ReadexPro', textAlign: 'center', lineHeight: 16, color: Colors.text }}>{t('contactUs.description')}</Text>
            </Card>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom padding for better scrolling */}
      <View style={{ height: 20 }} />

      <Modal
        visible={showContactModal}
        onDismiss={() => setShowContactModal(false)}
        overlayBackgroundColor={Colors.overlay}
      >
        <Card backgroundColor={Colors.card} padding-s6 style={{ minWidth: 320, width: '90%' }}>
          <Text h4 marginB-s4 center style={{ fontFamily: 'ReadexPro-Bold', color: Colors.primary }}>{t('contact.title')}</Text>
          <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: Colors.text }}>{t('contact.name')}</Text>
          <TextField
            style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: Colors.background, color: Colors.text, fontFamily: 'ReadexPro' }}
            value={contactForm.name}
            onChangeText={text => setContactForm({ ...contactForm, name: text })}
            placeholder={t('contact.namePlaceholder')}
            placeholderTextColor={Colors.textSecondary}
          />
          <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: Colors.text }}>{t('contact.email')}</Text>
          <TextField
            style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: Colors.background, color: Colors.text, fontFamily: 'ReadexPro' }}
            value={contactForm.email}
            onChangeText={text => setContactForm({ ...contactForm, email: text })}
            placeholder={t('contact.emailPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: Colors.text }}>{t('contact.subject')}</Text>
          <TextField
            style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: Colors.background, color: Colors.text, fontFamily: 'ReadexPro' }}
            value={contactForm.subject}
            onChangeText={text => setContactForm({ ...contactForm, subject: text })}
            placeholder={t('contact.subjectPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
          />
          <Text body marginB-s2 style={{ fontFamily: 'ReadexPro', color: Colors.text }}>{t('contact.content')}</Text>
          <TextField
            style={{ borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 16, height: 80, textAlignVertical: 'top', backgroundColor: Colors.background, color: Colors.text, fontFamily: 'ReadexPro' }}
            value={contactForm.content}
            onChangeText={text => setContactForm({ ...contactForm, content: text })}
            placeholder={t('contact.contentPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
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
              backgroundColor={Colors.card}
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
