import React, { useState } from 'react';
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

// Custom Text wrapper with proper Arabic text rendering
const ArabicText = ({ children, style, ...props }: any) => (
  <Text
    {...props}
    style={[
      {
        lineHeight: style?.fontSize ? style.fontSize * 1.5 : 24,
        includeFontPadding: false,
        paddingVertical: 2,
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
      borderColor: isSelected ? '#045468' : '#555',
      backgroundColor: isSelected ? '#045468' : '#2E3130',
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 16,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
      elevation: isSelected ? 4 : 0,
      shadowColor: isSelected ? '#045468' : 'transparent',
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
        color: isSelected ? '#fff' : '#888',
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
  const router = useRouter();
  const { showToast } = useToast();
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
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get or create local user ID
      let userId = await AsyncStorage.getItem('local_user_id');
      if (!userId) {
        userId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('local_user_id', userId);
      }

      // Save medical profile to local storage
      const profileData = {
        ...formData,
        isDiabetic: formData.medicalConditions.includes('السكري'),
        isHypertensive: formData.medicalConditions.includes('ارتفاع ضغط الدم'),
        isCholesterol: formData.medicalConditions.includes('الكوليسترول'),
        isSmoker: formData.medicalConditions.includes('مدخن'),
      };
      medicalStorage.saveUserProfile(userId, profileData);
      medicalStorage.setOnboardingComplete(userId, true);

      showToast({
        title: 'مرحباً بك',
        description: 'تم حفظ بياناتك بنجاح',
        type: 'success',
      });
      
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

    if (!formData.gender) {
      newErrors.gender = 'الرجاء اختيار الجنس';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'الرجاء إدخال تاريخ الميلاد';
    }

    if (!formData.height) {
      newErrors.height = 'الرجاء إدخال الطول';
    }

    if (!formData.weight) {
      newErrors.weight = 'الرجاء إدخال الوزن';
    }

    if (formData.medicalConditions.includes('مدخن') && (!formData.smokingDetails?.amount || !formData.smokingDetails?.duration)) {
      newErrors.smokingDetails = {
        amount: !formData.smokingDetails?.amount ? 'الرجاء تحديد كمية التدخين' : undefined,
        duration: !formData.smokingDetails?.duration ? 'الرجاء تحديد مدة التدخين' : undefined,
      };
    }

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
    if (bmi < 18.4) return 'نقص في الوزن';
    if (18.5 <= bmi && bmi < 24.9) return 'وزنك طبيعي';
    if (25 <= bmi && bmi < 29.9) return 'مرحلة ماقبل السمنة';
    if (30 <= bmi && bmi < 34.9) return 'سمنة درجة أولى';
    if (35 <= bmi && bmi < 39.9) return 'سمنة درجة ثانية';
    if (bmi > 40) return 'سمنة مفرطة درجة ثالثة';
    return 'حاول مرة أخرى';
  };

  const calculatePackYears = (smokingDetails: { amount: string; duration: string }): number => {
    const amount = parseFloat(smokingDetails.amount);
    const duration = parseFloat(smokingDetails.duration);
    return amount * duration;
  };

  return (
    <RNKeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card padding-s5 backgroundColor="#202221" br40>
          <View center marginB-s6>
            <Text h2 zimam-primary center marginB-s2>مرحباً بك في زِمامـ</Text>
            <Text body grey40 center>
              زِمامـ بالفحص واكتشف جميع الفحوصات المناسبة لك
            </Text>
          </View>

          <View>
            <View marginB-s4>
              <Text bodySmall dark10 right marginB-s2>تاريخ الميلاد</Text>
              <TouchableOpacity
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: errors.dateOfBirth ? '#ef4444' : '#555',
                  borderRadius: 8,
                  backgroundColor: '#202221',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
                onPress={() => {
                  setTempDate(formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: formData.dateOfBirth ? '#ECEDEE' : '#888', textAlign: 'right', fontFamily: 'ReadexPro', writingDirection: 'rtl' }}>
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'اختر تاريخ الميلاد'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <View style={{ backgroundColor: '#2E3130', borderRadius: 18, padding: 24, width: '90%', maxWidth: 400 }}>
                      <DateTimePicker
                        value={tempDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                        style={{ width: '100%' }}
                        textColor="#FFFFFF"
                        themeVariant="dark"
                      />
                      <View row spread marginT-s4 style={{ width: '100%', gap: 12 }}>
                        <Button
                          label="إلغاء"
                          backgroundColor="#202221"
                          style={{ flex: 1, paddingVertical: 12 }}
                          onPress={() => {
                            setShowDatePicker(false);
                            setTempDate(null);
                          }}
                          labelStyle={{ color: '#4CCCE6', fontFamily: 'ReadexPro-SemiBold', fontSize: 16 }}
                        />
                        <Button
                          label="تأكيد"
                          backgroundColor="#4CCCE6"
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
              {errors.dateOfBirth && (
                <Text error caption marginT-s1>{errors.dateOfBirth}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text bodySmall dark10 right marginB-s2>الجنس</Text>
              <View row spread style={{ gap: 12, flexDirection: 'row-reverse' }}>
                <ArabicButton
                  label="ذكر"
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
                      color={formData.gender === 'male' ? '#fff' : '#888'}
                    />
                  }
                  disabled={isSubmitting}
                />

                <ArabicButton
                  label="أنثى"
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
                      color={formData.gender === 'female' ? '#fff' : '#888'}
                    />
                  }
                  disabled={isSubmitting}
                />
              </View>
              {errors.gender && (
                <Text error caption marginT-s1>{errors.gender}</Text>
              )}
            </View>

            {/* Medical Survey Section */}
            <View marginT-s6 marginB-s4 paddingB-s2 style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <ArabicText 
                h3 
                zimam-primary 
                center 
                style={{ 
                  paddingVertical: 4
                }}
              >
                الاستبيان الطبي
              </ArabicText>
            </View>

            <View marginB-s4>
              <ArabicText bodySmall dark10 right marginB-s2>نمط الحياة</ArabicText>
              <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                {['قلة النشاط البدني', 'تدخين التبغ'].map((condition) => (
                  <Chip
                    key={condition}
                    label={condition}
                    onPress={() => {
                      const isSelected = formData.medicalConditions.includes(condition);
                      setFormData({
                        ...formData,
                        medicalConditions: isSelected
                          ? formData.medicalConditions.filter(c => c !== condition)
                          : [...formData.medicalConditions, condition]
                      });
                    }}
                    backgroundColor={formData.medicalConditions.includes(condition) ? '#045468' : '#2E3130'}
                    labelStyle={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.medicalConditions.includes(condition) ? '#fff' : '#888',
                      fontSize: 16,
                      lineHeight: 24,
                      includeFontPadding: false,
                      paddingVertical: 4,
                    }}
                    containerStyle={{
                      borderWidth: 2,
                      borderColor: formData.medicalConditions.includes(condition) ? '#045468' : '#555',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 24,
                      elevation: formData.medicalConditions.includes(condition) ? 4 : 0,
                      shadowColor: formData.medicalConditions.includes(condition) ? '#045468' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    }}
                  />
                ))}
              </View>
            </View>

            <View marginB-s4>
              <ArabicText bodySmall dark10 right marginB-s2>الحالات المزمنة</ArabicText>
              <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                {['مرض ارتفاع ضغط الدم', 'داء السكري', 'تاريخ لمرض قلبي وعائي', 'مرض عضوي مزمن'].map((condition) => (
                  <Chip
                    key={condition}
                    label={condition}
                    onPress={() => {
                      const isSelected = formData.medicalConditions.includes(condition);
                      setFormData({
                        ...formData,
                        medicalConditions: isSelected
                          ? formData.medicalConditions.filter(c => c !== condition)
                          : [...formData.medicalConditions, condition]
                      });
                    }}
                    backgroundColor={formData.medicalConditions.includes(condition) ? '#045468' : '#2E3130'}
                    labelStyle={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.medicalConditions.includes(condition) ? '#fff' : '#888',
                      fontSize: 16,
                      lineHeight: 24,
                      includeFontPadding: false,
                      paddingVertical: 4,
                    }}
                    containerStyle={{
                      borderWidth: 2,
                      borderColor: formData.medicalConditions.includes(condition) ? '#045468' : '#555',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 24,
                      elevation: formData.medicalConditions.includes(condition) ? 4 : 0,
                      shadowColor: formData.medicalConditions.includes(condition) ? '#045468' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    }}
                  />
                ))}
              </View>
            </View>

            <View marginB-s4>
              <ArabicText bodySmall dark10 right marginB-s2>الحالات الأخرى</ArabicText>
              <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                {['قراءات مرتفعة لضغط الدم', 'تاريخ عائلي للسكري'].map((condition) => (
                  <Chip
                    key={condition}
                    label={condition}
                    onPress={() => {
                      const isSelected = formData.medicalConditions.includes(condition);
                      setFormData({
                        ...formData,
                        medicalConditions: isSelected
                          ? formData.medicalConditions.filter(c => c !== condition)
                          : [...formData.medicalConditions, condition]
                      });
                    }}
                    backgroundColor={formData.medicalConditions.includes(condition) ? '#045468' : '#2E3130'}
                    labelStyle={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.medicalConditions.includes(condition) ? '#fff' : '#888',
                      fontSize: 16,
                      lineHeight: 24,
                      includeFontPadding: false,
                      paddingVertical: 4,
                    }}
                    containerStyle={{
                      borderWidth: 2,
                      borderColor: formData.medicalConditions.includes(condition) ? '#045468' : '#555',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 24,
                      elevation: formData.medicalConditions.includes(condition) ? 4 : 0,
                      shadowColor: formData.medicalConditions.includes(condition) ? '#045468' : 'transparent',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={{ gap: 16 }}>
              {formData.medicalConditions.includes('تدخين التبغ') && (
                <View style={{ gap: 12 }}>
                  <TextField
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: errors.smokingDetails?.amount ? '#ef4444' : '#555',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      fontSize: 16,
                      fontFamily: 'ReadexPro',
                      backgroundColor: '#202221',
                      color: '#ECEDEE',
                      textAlign: 'right',
                      writingDirection: 'rtl',
                    }}
                    placeholder=" كم عدد علب السجائر التي تدخنها يوميا؟"
                    value={formData.smokingDetails?.amount}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        smokingDetails: {
                          amount: text,
                          duration: formData.smokingDetails?.duration || '',
                        },
                      })
                    }
                    placeholderTextColor="#999"
                  />
                  <TextField
                    style={{
                      height: 48,
                      borderWidth: 1,
                      borderColor: errors.smokingDetails?.duration ? '#ef4444' : '#555',
                      borderRadius: 8,
                      paddingHorizontal: 16,
                      fontSize: 16,
                      fontFamily: 'ReadexPro',
                      backgroundColor: '#202221',
                      color: '#ECEDEE',
                      textAlign: 'right',
                      writingDirection: 'rtl',
                    }}
                    placeholder="منذ متى تدخن؟ (بالسنوات)"
                    value={formData.smokingDetails?.duration}
                    onChangeText={(text) =>
                      setFormData({
                        ...formData,
                        smokingDetails: {
                          amount: formData.smokingDetails?.amount || '',
                          duration: text,
                        },
                      })
                    }
                    placeholderTextColor="#999"
                  />
                  {formData.smokingDetails?.amount && formData.smokingDetails?.duration && (
                    <View style={{ backgroundColor: '#2E3130', padding: 12, borderRadius: 8, borderRightWidth: 3, borderRightColor: '#045468' }}>
                      <Text text80 style={{ fontFamily: 'ReadexPro-SemiBold', color: '#999', textAlign: 'right', writingDirection: 'rtl' }}>سنوات التدخين (Pack-Years):</Text>
                      <Text text60 style={{ fontFamily: 'ReadexPro-Bold', color: '#045468', textAlign: 'right', writingDirection: 'rtl' }}>{calculatePackYears(formData.smokingDetails)}</Text>
                    </View>
                  )}
                </View>
              )}

              <View marginB-s4>
                <Text bodySmall dark10 right marginB-s2>
                  الطول: {formData.height || '140'} سم
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
                  thumbTintColor="#045468"
                  minimumTrackTintColor="#045468"
                  maximumTrackTintColor="#555"
                  containerStyle={{ marginBottom: 8 }}
                />
                {errors.height && <Text error caption marginT-s1>{errors.height}</Text>}
              </View>

              <View marginB-s4>
                <Text bodySmall dark10 right marginB-s2>
                  الوزن: {formData.weight || '60'} كجم
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
                  thumbTintColor="#045468"
                  minimumTrackTintColor="#045468"
                  maximumTrackTintColor="#555"
                  containerStyle={{ marginBottom: 8 }}
                />
                {errors.weight && <Text error caption marginT-s1>{errors.weight}</Text>}
              </View>

              {/* BMI Display */}
              {formData.height && formData.weight && (
                <View style={{ backgroundColor: '#2E3130', padding: 16, borderRadius: 12, borderRightWidth: 4, borderRightColor: '#4CCCE6', alignItems: 'center' }}>
                  <Text text80 style={{ fontFamily: 'ReadexPro-SemiBold', color: '#999', textAlign: 'center', marginBottom: 4 }}>مؤشر كتلة الجسم (BMI):</Text>
                  <Text style={{ fontFamily: 'ReadexPro-Bold', color: '#4CCCE6', textAlign: 'center', fontSize: 28, marginBottom: 4 }}>
                    {calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)).toFixed(1)}
                  </Text>
                  <Text text80 style={{ fontFamily: 'ReadexPro-Medium', color: '#ECEDEE', textAlign: 'center' }}>
                    {getBMICategory(calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)))}
                  </Text>
                </View>
              )}

              {formData.gender === 'female' && (
                <View marginB-s4>
                  <Checkbox
                    value={formData.isPregnant}
                    onValueChange={(value) => setFormData({ ...formData, isPregnant: value })}
                    label="  هل أنت حامل؟"
                    color="#045468"
                    labelStyle={{ 
                      fontFamily: 'ReadexPro-Medium', 
                      color: '#ECEDEE', 
                      fontSize: 16, 
                      writingDirection: 'rtl',
                      marginLeft: 0,
                      marginRight: 8,
                    }}
                    containerStyle={{ 
                      flexDirection: 'row', 
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  />
                </View>
              )}

              <View marginB-s4>
                <Checkbox
                  value={formData.isSexuallyActive}
                  onValueChange={(value) => setFormData({ ...formData, isSexuallyActive: value })}
                  label="  هل أنت نشط جنسياً؟"
                  color="#045468"
                  labelStyle={{ 
                    fontFamily: 'ReadexPro-Medium', 
                    color: '#ECEDEE', 
                    fontSize: 16, 
                    writingDirection: 'rtl',
                    marginLeft: 0,
                    marginRight: 8,
                  }}
                  containerStyle={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                />
              </View>

              {formData.isSexuallyActive && (
                <View marginB-s4>
                  <Text bodySmall dark10 right marginB-s2>عدد الشركاء</Text>
                  <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                    <ArabicButton
                      label="شريك واحد"
                      isSelected={formData.sexualActivityDetails?.partnerCount === 'single'}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          sexualActivityDetails: { ...formData.sexualActivityDetails, partnerCount: 'single' },
                        })
                      }
                    />
                    <ArabicButton
                      label="أكثر من شريك"
                      isSelected={formData.sexualActivityDetails?.partnerCount === 'multiple'}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          sexualActivityDetails: { ...formData.sexualActivityDetails, partnerCount: 'multiple' },
                        })
                      }
                    />
                  </View>
                </View>
              )}
            </View>

            <Button
              label="حفظ البيانات"
              backgroundColor={isSubmitting ? "#666" : "#045468"}
              paddingV-16
              borderRadius={200}
              marginT-24
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSubmit}
              labelStyle={{ fontFamily: 'ReadexPro-Bold', fontSize: 16 }}
            />
          </View>
        </Card>
      </ScrollView>
    </RNKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202221',
    paddingTop: 32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
});

