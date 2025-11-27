import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { changeRTLDirection } from '../lib/rtlSetup';

const { width } = Dimensions.get('window');
const INTRO_STORAGE_KEY = 'intro_completed';

interface FeatureItem {
  icon: string;
  iconType: 'material' | 'ionicons';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

const features: FeatureItem[] = [
  // Screen 2 features
  {
    icon: 'account-cog-outline',
    iconType: 'material',
    titleAr: 'التخصيص الذكي',
    titleEn: 'Personalization',
    descAr: 'تصمم التوصيات لكل شخص بناء على جنسه وعمره ومعلوماته الصحية مع المحافظة على خصوصيته',
    descEn: 'Recommendations tailored based on age, gender, and health information while ensuring privacy',
  },
  {
    icon: 'glasses',
    iconType: 'material',
    titleAr: 'الاختيار الملائم',
    titleEn: 'Smart Selection',
    descAr: 'اختيرت التوصيات بعناية لتتلاءم مع الاحتياجات الصحية للمجتمع السعودي وإمكانيات النظام الصحي',
    descEn: 'Recommendations carefully selected to match Saudi community needs and healthcare system capabilities',
  },
  {
    icon: 'clipboard-text-outline',
    iconType: 'material',
    titleAr: 'المراجعة العلمية',
    titleEn: 'Scientific Review',
    descAr: 'راجع التوصيات عدد من الاستشاريين والأخصائيين لضمان أنها دقيقة ومبنية على البراهين العلمية',
    descEn: 'Recommendations reviewed by healthcare consultants and specialists to ensure they are precise and evidence-based',
  },
  // Screen 3 features
  {
    icon: 'heart-outline',
    iconType: 'material',
    titleAr: 'التوعية الصحية',
    titleEn: 'Health Awareness',
    descAr: 'تتضمن التوصيات مواضيع توعوية من مصادر موثوقة تغطي أشهر الأمراض التي يمكن الوقاية منها',
    descEn: 'Recommendations include trusted resources about common preventable diseases and conditions',
  },
  {
    icon: 'leaf-outline',
    iconType: 'ionicons',
    titleAr: 'الوصول للخدمة',
    titleEn: 'Service Access',
    descAr: 'تقدم التوصيات تفاصيل عن كيفية الوصول إلى الخدمة الوقائية عبر مزودي خدمات الرعاية الصحية',
    descEn: 'Recommendations provide detailed guidance on accessing preventive services through healthcare service providers',
  },
  {
    icon: 'umbrella-outline',
    iconType: 'ionicons',
    titleAr: 'التغطية التأمينية',
    titleEn: 'Insurance Coverage',
    descAr: 'تشمل التوصيات معلومات عن التغطية التأمينية للخدمة الوقائية للمستفيدين من التأمين الصحي',
    descEn: 'Recommendations offer information about preventive service insurance coverage for health insurance beneficiaries',
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const isArabic = i18n.language === 'ar';

  // Scroll to correct initial position
  useEffect(() => {
    if (isLayoutReady) {
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [isLayoutReady]);

  // Check if intro was already completed
  useEffect(() => {
    AsyncStorage.getItem(INTRO_STORAGE_KEY).then(value => {
      if (value === 'true') {
        // Check authentication and redirect appropriately
        AsyncStorage.getItem('healthscreen_user_id').then(userId => {
          if (userId) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        });
      }
    });
  }, []);

  const handleSkip = async () => {
    await AsyncStorage.setItem(INTRO_STORAGE_KEY, 'true');
    // Check authentication and redirect appropriately
    const userId = await AsyncStorage.getItem('healthscreen_user_id');
    if (userId) {
      router.replace('/(tabs)');
    } else {
      router.replace('/onboarding');
    }
  };

  const handleNext = () => {
    if (currentPage < 2) {
      const nextPage = currentPage + 1;
      scrollRef.current?.scrollTo({ x: nextPage * width, animated: true });
      setCurrentPage(nextPage);
    } else {
      handleSkip();
    }
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    await i18n.changeLanguage(newLang);
    await changeRTLDirection(newLang === 'ar');
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const page = Math.round(scrollX / width);
    setCurrentPage(page);
  };

  const colors = {
    background: isDark ? '#101211' : '#fbfdfc',
    card: isDark ? '#202221' : '#eef1f0',
    text: isDark ? '#eceeed' : '#1a211e',
    textSecondary: isDark ? '#adb5b2' : '#5f6563',
    primary: isDark ? '#12677e' : '#00a2c7',
    primaryLight: isDark ? '#045468' : '#9ddde7',
  };

  const renderFeatureCard = (feature: FeatureItem, index: number) => {
    const IconComponent = feature.iconType === 'material' ? MaterialCommunityIcons : Ionicons;
    return (
      <View 
        key={index} 
        style={[
          styles.featureCard, 
          { 
            backgroundColor: colors.card, 
            borderColor: colors.primary,
            flexDirection: isArabic ? 'row-reverse' : 'row',
          }
        ]}
      >
        <View style={[styles.featureIconContainer, { backgroundColor: colors.primaryLight + '30' }]}>
          <IconComponent name={feature.icon as any} size={28} color={colors.primary} />
        </View>
        <View style={styles.featureTextContainer}>
          <Text style={[styles.featureTitle, { color: colors.primary, textAlign: isArabic ? 'right' : 'left' }]}>
            {isArabic ? feature.titleAr : feature.titleEn}
          </Text>
          <Text style={[styles.featureDesc, { color: colors.textSecondary, textAlign: isArabic ? 'right' : 'left' }]}>
            {isArabic ? feature.descAr : feature.descEn}
          </Text>
        </View>
      </View>
    );
  };

  // Screen 1: Welcome
  const renderScreen1 = () => (
    <View style={[styles.page, { width }]}>
      <View style={styles.welcomeContent}>
        <Text style={[styles.appName, { color: colors.primary }]}>زِمام</Text>
        <Text style={[styles.welcomeText, { color: colors.text, textAlign: isArabic ? 'right' : 'left' }]}>
          {isArabic
            ? 'نقدم توصيات صحية وقائية مبنية على البراهين، ومخصصة للأشخاص البالغين في المملكة العربية السعودية، مع تفاصيل الوصول إلى الخدمات الموصى بها وتغطيتها التأمينية وفوائد أخرى'
            : 'We provide evidence-based preventive health recommendations tailored for adults in Saudi Arabia, with details on accessing recommended services, their insurance coverage, and other benefits'}
        </Text>
      </View>
    </View>
  );

  // Screen 2: Features 1-3
  const renderScreen2 = () => (
    <View style={[styles.page, { width }]}>
      <Text style={[styles.featuresTitle, { color: colors.primary }]}>
        {isArabic ? 'مميزات زمام' : 'Zimam Features'}
      </Text>
      <View style={styles.featuresContainer}>
        {features.slice(0, 3).map((feature, index) => renderFeatureCard(feature, index))}
      </View>
    </View>
  );

  // Screen 3: Features 4-6
  const renderScreen3 = () => (
    <View style={[styles.page, { width }]}>
      <Text style={[styles.featuresTitle, { color: colors.primary }]}>
        {isArabic ? 'مميزات زمام' : 'Zimam Features'}
      </Text>
      <View style={styles.featuresContainer}>
        {features.slice(3, 6).map((feature, index) => renderFeatureCard(feature, index + 3))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
        {/* Language & Theme toggles (left in LTR, right in RTL) */}
        <View style={[styles.togglesContainer, { flexDirection: isArabic ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={[styles.toggleButton, { backgroundColor: colors.card }]} 
            onPress={toggleLanguage}
          >
            <Text style={[styles.toggleText, { color: colors.primary }]}>
              {isArabic ? 'EN' : 'ع'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, { backgroundColor: colors.card, marginLeft: isArabic ? 0 : 8, marginRight: isArabic ? 8 : 0 }]} 
            onPress={toggleTheme}
          >
            <Ionicons 
              name={isDark ? 'sunny-outline' : 'moon-outline'} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Skip button (right in LTR, left in RTL) */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            {isArabic ? 'تخطي' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content - Force LTR for horizontal scrolling regardless of RTL setting */}
      <View style={{ flex: 1, direction: 'ltr' }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={[styles.scrollView, { direction: 'ltr' }]}
          contentContainerStyle={{ flexDirection: 'row' }}
          onLayout={() => setIsLayoutReady(true)}
        >
          {renderScreen1()}
          {renderScreen2()}
          {renderScreen3()}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: currentPage === index ? colors.primary : colors.card,
                  width: currentPage === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Next/Start button */}
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentPage === 2
              ? (isArabic ? 'ابدأ الآن' : 'Start Now')
              : (isArabic ? 'التالي' : 'Next')}
          </Text>
          {currentPage < 2 && (
            <Ionicons
              name={isArabic ? 'chevron-back' : 'chevron-forward'}
              size={20}
              color="#fff"
              style={{ marginLeft: isArabic ? 0 : 8, marginRight: isArabic ? 8 : 0 }}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  togglesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: 'ReadexPro-Bold',
    fontSize: 14,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: 'ReadexPro-Medium',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  appName: {
    fontFamily: 'ReadexPro-Bold',
    fontSize: 56,
    marginBottom: 32,
  },
  welcomeText: {
    fontFamily: 'ReadexPro',
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'center',
  },
  featuresTitle: {
    fontFamily: 'ReadexPro-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'ReadexPro-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: 'ReadexPro',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextButtonText: {
    fontFamily: 'ReadexPro-Bold',
    fontSize: 18,
    color: '#fff',
  },
});
