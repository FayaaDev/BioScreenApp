import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  Platform,
  I18nManager,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  StyleSheet,
  Modal,
} from 'react-native';
import { View, Text, Card, Button, TextField, TouchableOpacity, Checkbox, Slider, ChipsInput, Chip, WheelPicker } from 'react-native-ui-lib';
import { useRouter } from 'expo-router';
import { useToast } from '../hooks/useToast';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { medicalStorage } from '../lib/medical-storage';
import { Colors } from 'react-native-ui-lib';
import { useColorScheme } from '../hooks/useColorScheme';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

// Custom Text wrapper with proper Arabic text rendering
const ArabicText = ({ children, style, ...props }: any) => (
  <Text
    {...props}
    style={[
      {
        lineHeight: style?.fontSize ? style.fontSize * 1.6 : 26,
        includeFontPadding: false,
        paddingVertical: 4,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

// Reusable Arabic Button Component
const ArabicButton = ({
  label,
  isSelected,
  onPress,
  icon,
  disabled = false,
  style = {}
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: any;
}) => (
  <TouchableOpacity
    style={[{
      flex: 1,
      minHeight: 56,
      borderWidth: 2,
      borderColor: isSelected ? Colors.primary : Colors.textSecondary,
      backgroundColor: isSelected ? Colors.primary : Colors.card,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      elevation: isSelected ? 4 : 0,
      shadowColor: isSelected ? Colors.primary : 'transparent',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    }, style]}
    onPress={onPress}
    disabled={disabled}
  >
    {icon}
    <Text
      style={{
        fontFamily: 'ReadexPro-Bold',
        color: isSelected ? Colors.white : Colors.textSecondary,
        writingDirection: 'rtl',
        fontSize: 15,
        lineHeight: 24,
        includeFontPadding: false,
      }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface OnboardingFormData {
  gender: string;
  dateOfBirth: string;
  medicalConditions: string[];
  smokingDetails?: {
    amount: string;
    duration: string;
  };
  height: string;
  weight: string;
  isPregnant?: boolean;
  isSexuallyActive: boolean;
  sexualActivityDetails?: {
    partnerCount: 'single' | 'multiple';
  };
  saveData: boolean;
}

interface FormErrors {
  gender?: string;
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  smokingDetails?: {
    amount?: string;
    duration?: string;
  };
}

export default function Onboarding() {
  const colorScheme = useColorScheme() ?? 'light';
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState<OnboardingFormData>({
    gender: '',
    dateOfBirth: '',
    medicalConditions: [],
    smokingDetails: {
      amount: '',
      duration: '',
    },
    height: '',
    weight: '',
    isPregnant: false,
    isSexuallyActive: false,
    sexualActivityDetails: {
      partnerCount: 'single',
    },
    saveData: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInfoCondition, setSelectedInfoCondition] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing profile data on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('local_user_id');
        if (userId) {
          const existingProfile = await medicalStorage.getUserProfile(userId);
          if (existingProfile) {
            setFormData({
              gender: existingProfile.gender || '',
              dateOfBirth: existingProfile.dateOfBirth || '',
              medicalConditions: existingProfile.medicalConditions || [],
              smokingDetails: existingProfile.smokingDetails || { amount: '', duration: '' },
              height: existingProfile.height || '',
              weight: existingProfile.weight || '',
              isPregnant: existingProfile.isPregnant || false,
              isSexuallyActive: existingProfile.isSexuallyActive || false,
              sexualActivityDetails: existingProfile.sexualActivityDetails || { partnerCount: 'single' },
              saveData: true, // If they had saved data before, default to save again
            });
            
            // Set tempDate for the date picker if dateOfBirth exists
            if (existingProfile.dateOfBirth) {
              setTempDate(new Date(existingProfile.dateOfBirth));
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingProfile();
  }, []);

  const getConditionTranslationKey = (condition: string): string => {
    const map: { [key: string]: string } = {
      'physicalInactivity': 'physicalInactivity',
      'tobaccoSmoking': 'tobaccoSmoking',
      'hypertension': 'hypertension',
      'diabetes': 'diabetes',
      'cardiovascularHistory': 'cardiovascularHistory',
      'chronicOrganDisease': 'chronicOrganDisease',
      'highBloodPressureReadings': 'highBloodPressureReadings',
      'familyDiabetesHistory': 'familyDiabetesHistory',
      'gestationalDiabetesHistory': 'gestationalDiabetesHistory',
      'sexualHistory': 'sexualHistory'
    };
    return map[condition] || condition;
  };

  const conditionExplanations: { [key: string]: string } = {
    'physicalInactivity': t('family.explanations.physicalInactivity'),
    'tobaccoSmoking': t('family.explanations.tobaccoSmoking'),
    'hypertension': t('family.explanations.hypertension'),
    'diabetes': t('family.explanations.diabetes'),
    'cardiovascularHistory': t('family.explanations.cardiovascularHistory'),
    'chronicOrganDisease': t('family.explanations.chronicOrganDisease'),
    'highBloodPressureReadings': t('family.explanations.highBloodPressureReadings'),
    'familyDiabetesHistory': t('family.explanations.familyDiabetesHistory'),
    'gestationalDiabetesHistory': t('family.explanations.gestationalDiabetesHistory'),
    'sexualHistory': t('family.explanations.sexualHistory'),
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast({
        title: 'تنبيه',
        description: 'الرجاء ملء جميع الحقول المطلوبة',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get or create local user ID
      let userId = await AsyncStorage.getItem('local_user_id');
      if (!userId) {
        // Create a new local user ID if it doesn't exist
        userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('local_user_id', userId);
      }
      
      // Always save the user profile data for this session
      await medicalStorage.saveUserProfile(userId, {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        height: formData.height,
        weight: formData.weight,
        medicalConditions: formData.medicalConditions,
        smokingDetails: formData.smokingDetails,
        isDiabetic: formData.medicalConditions.includes('diabetes'),
        isHypertensive: formData.medicalConditions.includes('hypertension'),
        isCholesterol: formData.medicalConditions.includes('highBloodPressureReadings'),
        isSmoker: formData.medicalConditions.includes('tobaccoSmoking'),
        isPregnant: formData.isPregnant,
        isSexuallyActive: formData.isSexuallyActive,
        sexualActivityDetails: formData.sexualActivityDetails,
      });

      // Invalidate queries to refresh profile data in all screens
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });

      // Sync with backend
      try {
        await medicalStorage.syncUserProfile(userId, {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          height: formData.height,
          weight: formData.weight,
          medicalConditions: formData.medicalConditions,
          smokingDetails: formData.smokingDetails,
          isDiabetic: formData.medicalConditions.includes('diabetes'),
          isHypertensive: formData.medicalConditions.includes('hypertension'),
          isCholesterol: formData.medicalConditions.includes('highBloodPressureReadings'),
          isSmoker: formData.medicalConditions.includes('tobaccoSmoking'),
          isPregnant: formData.isPregnant,
          isSexuallyActive: formData.isSexuallyActive,
          sexualActivityDetails: formData.sexualActivityDetails,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await medicalStorage.fetchAndSyncScreenings(userId);
      } catch (syncError) {
        console.error('Backend sync failed during onboarding:', syncError);
        // Continue anyway, we can sync later
      }

      // Only mark onboarding as complete if user wants to save permanently
      if (formData.saveData) {
        await medicalStorage.setOnboardingComplete(userId, true);
        showToast({
          title: 'مرحباً بك',
          description: 'تم حفظ بياناتك بشكل دائم',
          type: 'success',
        });
      } else {
        showToast({
          title: 'مرحباً بك',
          description: 'تم حفظ بياناتك لهذه الجلسة فقط',
          type: 'success',
        });
      }

      // Small delay to ensure AsyncStorage completes before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      showToast({
        title: 'خطأ',
        description: 'فشل في حفظ بياناتك. حاول مرة أخرى',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    console.log('Validating form data:', JSON.stringify(formData, null, 2));

    if (!formData.gender) {
      newErrors.gender = t('onboarding.validation.gender');
      console.log('Validation failed: gender is missing');
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('onboarding.validation.dateOfBirth');
      console.log('Validation failed: dateOfBirth is missing');
    }

    if (!formData.height) {
      newErrors.height = t('onboarding.validation.height');
      console.log('Validation failed: height is missing');
    }

    if (!formData.weight) {
      newErrors.weight = t('onboarding.validation.weight');
      console.log('Validation failed: weight is missing');
    }

    // Smoking details validation - disabled for now, will be added later
    // if (formData.medicalConditions.includes('tobaccoSmoking') && (!formData.smokingDetails?.amount || !formData.smokingDetails?.duration)) {
    //   newErrors.smokingDetails = {
    //     amount: !formData.smokingDetails?.amount ? 'الرجاء تحديد كمية التدخين' : undefined,
    //     duration: !formData.smokingDetails?.duration ? 'الرجاء تحديد مدة التدخين' : undefined,
    //   };
    //   console.log('Validation failed: smoking details missing');
    // }

    console.log('Validation errors:', JSON.stringify(newErrors, null, 2));
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const calculateBMI = (heightCm: number, weightKg: number): number => {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  };

  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.4) return t('onboarding.bmiCategories.underweight');
    if (18.5 <= bmi && bmi < 24.9) return t('onboarding.bmiCategories.normal');
    if (25 <= bmi && bmi < 29.9) return t('onboarding.bmiCategories.preObesity');
    if (30 <= bmi && bmi < 34.9) return t('onboarding.bmiCategories.obesity1');
    if (35 <= bmi && bmi < 39.9) return t('onboarding.bmiCategories.obesity2');
    if (bmi > 40) return t('onboarding.bmiCategories.obesity3');
    return t('onboarding.bmiCategories.tryAgain');
  };

  const calculatePackYears = (smokingDetails: { amount: string; duration: string }): number => {
    const amount = parseFloat(smokingDetails.amount);
    const duration = parseFloat(smokingDetails.duration);
    return amount * duration;
  };

  const renderConditionChip = (condition: string) => {
    const isSelected = formData.medicalConditions.includes(condition);
    const translationKey = condition;

    return (
      <View key={condition} style={{ position: 'relative' }}>
        <Chip
          label={t(`family.conditions.${translationKey}`, { defaultValue: condition })}
          onPress={() => {
            setFormData({
              ...formData,
              medicalConditions: isSelected
                ? formData.medicalConditions.filter(c => c !== condition)
                : [...formData.medicalConditions, condition]
            });
          }}
          backgroundColor={isSelected ? Colors.primary : Colors.card}
          labelStyle={{
            fontFamily: 'ReadexPro-Bold',
            color: isSelected ? Colors.white : Colors.textSecondary,
            fontSize: 16,
            lineHeight: 24,
            includeFontPadding: false,
            paddingVertical: 4,
            paddingRight: 32, // Make room for info icon
          }}
          containerStyle={{
            borderWidth: 2,
            borderColor: isSelected ? Colors.primary : Colors.textSecondary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 24,
            elevation: isSelected ? 4 : 0,
            shadowColor: isSelected ? Colors.primary : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        />
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: [{ translateY: -12 }],
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: isSelected ? Colors.white + '33' : Colors.primary + '33',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
          onPress={() => {
            setSelectedInfoCondition(condition);
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="info-outline"
            size={16}
            color={isSelected ? Colors.white : Colors.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Show loading state while fetching existing profile
  if (isLoading) {
    return (
      <View flex center backgroundColor={Colors.background}>
        <Text color={Colors.textSecondary}>{t('common.loading', 'جاري التحميل...')}</Text>
      </View>
    );
  }

  return (
    <RNKeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card padding-s5 backgroundColor={Colors.card} br40>
          <View center marginB-s6>
            <Text h2 zimam-primary center marginB-s2>{t("onboarding.welcomeTitle")}</Text>
            <Text body color={Colors.textSecondary} center>
              {t("onboarding.welcomeDesc")}
            </Text>
          </View>

          <View>
            <View marginB-s4>
              <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>{t("profile.gender")}</Text>
              <View row spread style={{ gap: 12, flexDirection: 'row-reverse' }}>
                <ArabicButton
                  label={t("common.male")}
                  isSelected={formData.gender === 'male'}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'male' });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  icon={
                    <MaterialIcons
                      name="male"
                      size={20}
                      color={formData.gender === 'male' ? Colors.white : Colors.textSecondary}
                    />
                  }
                  disabled={isSubmitting}
                />

                <ArabicButton
                  label={t("common.female")}
                  isSelected={formData.gender === 'female'}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'female' });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  icon={
                    <MaterialIcons
                      name="female"
                      size={20}
                      color={formData.gender === 'female' ? Colors.white : Colors.textSecondary}
                    />
                  }
                  disabled={isSubmitting}
                />
              </View>
              {errors.gender && (
                <Text error caption marginT-s1>{errors.gender}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>{t("profile.dateOfBirth")}</Text>
              <TouchableOpacity
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: errors.dateOfBirth ? Colors.error : Colors.textSecondary,
                  borderRadius: 8,
                  backgroundColor: Colors.card,
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setTempDate(formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: formData.dateOfBirth ? Colors.text : Colors.textSecondary, textAlign: 'right', fontFamily: 'ReadexPro', writingDirection: 'rtl' }}>
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                    : t('onboarding.selectDate')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && Platform.OS === 'ios' && (
                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.overlay }}>
                    <View style={{ backgroundColor: Colors.card, borderRadius: 18, padding: 24, width: '90%', maxWidth: 400 }}>
                      <DateTimePicker
                        value={tempDate || new Date()}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                        style={{ width: '100%', height: 180 }}
                        textColor={Colors.text}
                        themeVariant="dark"
                      />
                      <View row spread marginT-s4 style={{ width: '100%', gap: 12 }}>
                        <Button
                          label={t("common.cancel")}
                          backgroundColor={Colors.background}
                          style={{ flex: 1, paddingVertical: 12 }}
                          onPress={() => {
                            setShowDatePicker(false);
                            setTempDate(null);
                          }}
                          labelStyle={{ color: Colors.primary, fontFamily: 'ReadexPro-SemiBold', fontSize: 16 }}
                        />
                        <Button
                          label={t("family.confirm")}
                          backgroundColor={Colors.primary}
                          style={{ flex: 1, paddingVertical: 12 }}
                          onPress={() => {
                            if (tempDate) {
                              setFormData({
                                ...formData,
                                dateOfBirth: tempDate.toISOString().split('T')[0],
                              });
                              if (errors.dateOfBirth) {
                                setErrors({ ...errors, dateOfBirth: undefined });
                              }
                            }
                            setShowDatePicker(false);
                          }}
                          labelStyle={{ fontFamily: 'ReadexPro-SemiBold', fontSize: 16 }}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={tempDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && selectedDate) {
                      setFormData({
                        ...formData,
                        dateOfBirth: selectedDate.toISOString().split('T')[0],
                      });
                      if (errors.dateOfBirth) {
                        setErrors({ ...errors, dateOfBirth: undefined });
                      }
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                  positiveButton={{ label: t("family.confirm"), textColor: Colors.primary }}
                  negativeButton={{ label: t("common.cancel"), textColor: Colors.error }}
                  themeVariant="dark"
                />
              )}
              {errors.dateOfBirth && (
                <Text error caption marginT-s1>{errors.dateOfBirth}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>
                {t("onboarding.height")}: {formData.height || '140'} {t("common.cm")}
              </Text>
              <Slider
                value={parseFloat(formData.height) || 140}
                minimumValue={100}
                maximumValue={250}
                step={1}
                onValueChange={(value) => {
                  setFormData({ ...formData, height: value.toString() });
                  if (errors.height) {
                    setErrors({ ...errors, height: undefined });
                  }
                }}
                thumbTintColor={formData.height ? Colors.primary : Colors.textSecondary}
                minimumTrackTintColor={formData.height ? Colors.primary : Colors.textSecondary}
                maximumTrackTintColor={Colors.textSecondary}
                containerStyle={{ marginBottom: 8 }}
              />
              {errors.height && <Text error caption marginT-s1>{errors.height}</Text>}
            </View>

            <View marginB-s4>
              <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>
                {t("onboarding.weight")}: {formData.weight || '60'} {t("common.kg")}
              </Text>
              <Slider
                value={parseFloat(formData.weight) || 60}
                minimumValue={30}
                maximumValue={200}
                step={1}
                onValueChange={(value) => {
                  setFormData({ ...formData, weight: value.toString() });
                  if (errors.weight) {
                    setErrors({ ...errors, weight: undefined });
                  }
                }}
                thumbTintColor={formData.weight ? Colors.primary : Colors.textSecondary}
                minimumTrackTintColor={formData.weight ? Colors.primary : Colors.textSecondary}
                maximumTrackTintColor={Colors.textSecondary}
                containerStyle={{ marginBottom: 8 }}
              />
              {errors.weight && <Text error caption marginT-s1>{errors.weight}</Text>}
            </View>

            {/* BMI Display */}
            {formData.height && formData.weight && (
              <Card
                backgroundColor={Colors.card}
                enableShadow
                elevation={5}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderRightWidth: 4,
                  borderRightColor: Colors.primary,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: Colors.primary + '20',
                }}
              >
                <Text text80 style={{ fontFamily: 'ReadexPro-SemiBold', color: Colors.textSecondary, textAlign: 'center', marginBottom: 4 }}>{t("family.bmi")}</Text>
                <Text style={{ fontFamily: 'ReadexPro-Bold', color: Colors.primary, textAlign: 'center', fontSize: 28, marginBottom: 4 }}>
                  {calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)).toFixed(1)}
                </Text>
                <Text text80 style={{ fontFamily: 'ReadexPro-Medium', color: Colors.text, textAlign: 'center' }}>
                  {getBMICategory(calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)))}
                </Text>
              </Card>
            )}

            {/* Medical Survey Section */}
            <View marginT-s6 marginB-s4 paddingB-s2 style={{ borderBottomWidth: 1, borderBottomColor: Colors.textSecondary + '40' }}>
              <ArabicText
                h3
                zimam-primary
                center
                style={{
                  paddingVertical: 4
                }}
              >
                {t("family.medicalSurveyTitle")}
              </ArabicText>
              <Text body color={Colors.textSecondary} center marginT-s2>
                {t('onboarding.medicalSurveyDesc')}
              </Text>
            </View>

            <View marginB-s4>
              <ArabicText bodySmall right marginB-s2 style={{ color: Colors.text }}>{t("family.lifestyle")}</ArabicText>
              <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                {['physicalInactivity', 'tobaccoSmoking'].map(renderConditionChip)}
              </View>
            </View>

            <View marginB-s4>
              <ArabicText bodySmall right marginB-s2 style={{ color: Colors.text }}>{t("family.chronicConditions")}</ArabicText>
              <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                {['hypertension', 'diabetes', 'cardiovascularHistory', 'chronicOrganDisease'].map(renderConditionChip)}
              </View>
            </View>

            <View marginB-s4>
              <ArabicText bodySmall right marginB-s2 style={{ color: Colors.text }}>{t("family.otherConditions")}</ArabicText>
              <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                {['highBloodPressureReadings', 'familyDiabetesHistory'].map(renderConditionChip)}
                {formData.gender === 'female' && (
                  <>
                    {renderConditionChip('gestationalDiabetesHistory')}
                    {renderConditionChip('sexualHistory')}
                  </>
                )}
              </View>
            </View>

            {/* Info Modal */}
            {selectedInfoCondition && (
              <Modal
                visible={!!selectedInfoCondition}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedInfoCondition(null)}
              >
                <TouchableOpacity
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.overlay }}
                  activeOpacity={1}
                  onPress={() => setSelectedInfoCondition(null)}
                >
                  <View style={{ backgroundColor: Colors.card, borderRadius: 16, padding: 24, width: '85%', maxWidth: 400, borderWidth: 2, borderColor: Colors.primary }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 12 }}>
                      <MaterialIcons name="info" size={28} color={Colors.primary} />
                      <Text style={{ fontFamily: 'ReadexPro-Bold', color: Colors.primary, fontSize: 18, textAlign: 'center', lineHeight: 28 }}>
                        {t(`family.conditions.${selectedInfoCondition}`)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'ReadexPro-Medium', color: Colors.text, fontSize: 16, textAlign: 'center', lineHeight: 26, marginBottom: 20 }}>
                      {conditionExplanations[selectedInfoCondition] || t("common.noInfo")}
                    </Text>
                    <Button
                      label={t("common.understood")}
                      backgroundColor={Colors.primary}
                      paddingV-12
                      borderRadius={12}
                      onPress={() => setSelectedInfoCondition(null)}
                      labelStyle={{ fontFamily: 'ReadexPro-SemiBold', fontSize: 16 }}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            )}

            <View style={{ gap: 16 }}>
              {/* Removed smoking details fields */}
            </View>

            <View marginT-s4 marginB-s4>
              <Checkbox
                value={formData.saveData}
                onValueChange={(value) => setFormData({ ...formData, saveData: value })}
                label={t("onboarding.saveData")}
                color={Colors.primary}
                labelStyle={{
                  fontFamily: 'ReadexPro-Medium',
                  color: Colors.text,
                  fontSize: 14,
                  writingDirection: 'rtl',
                  marginLeft: 0,
                  marginRight: 8,
                  lineHeight: 22,
                  paddingVertical: 4,
                }}
                containerStyle={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingVertical: 4,
                }}
              />
              <Text bodySmall right marginT-s1 style={{ color: Colors.textSecondary, lineHeight: 18, paddingVertical: 2 }}>
                {t("onboarding.saveDataDesc")}
              </Text>
            </View>

            <Button
              label={t("common.save")}
              backgroundColor={isSubmitting ? Colors.textSecondary : Colors.primary}
              paddingV-16
              borderRadius={200}
              marginT-24
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSubmit}
              labelStyle={{ fontFamily: 'ReadexPro-Bold', fontSize: 16 }}
            />
          </View>
        </Card >
      </ScrollView >
    </RNKeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
});

