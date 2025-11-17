import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  TouchableOpacity as RNTouchableOpacity,
} from 'react-native';
import { View, Text, Card, Button } from 'react-native-ui-lib';
import { useRouter } from 'expo-router';
import { useToast } from '../hooks/useToast';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { medicalStorage } from '../lib/medical-storage';

interface OnboardingFormData {
  gender: string;
  dateOfBirth: string;
  isDiabetic: boolean;
  isHypertensive: boolean;
  isCholesterol: boolean;
  isSmoker: boolean;
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
    isDiabetic: false,
    isHypertensive: false,
    isCholesterol: false,
    isSmoker: false,
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
      medicalStorage.saveUserProfile(userId, formData);
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

    if (formData.isSmoker && (!formData.smokingDetails?.amount || !formData.smokingDetails?.duration)) {
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#202221', paddingTop: 32 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Card padding-s5 backgroundColor="#2E3130" br40>
          <View center marginB-s6>
            <Text text60 zimam-primary style={{ fontFamily: 'ReadexPro-Bold', textAlign: 'center', marginBottom: 8 }}>مرحباً بك في زِمامـ</Text>
            <Text text70 grey40 style={{ fontFamily: 'ReadexPro', textAlign: 'center' }}>
              زِمامـ بالفحص واكتشف جميع الفحوصات المناسبة لك
            </Text>
          </View>

          <View>
            <View marginB-s4>
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>تاريخ الميلاد</Text>
              <RNTouchableOpacity
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: errors.dateOfBirth ? '#ef4444' : '#555',
                  borderRadius: 8,
                  backgroundColor: '#202221',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  setTempDate(formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: formData.dateOfBirth ? '#ECEDEE' : '#888', textAlign: 'right', fontFamily: 'ReadexPro' }}>
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'اختر تاريخ الميلاد'}
                </Text>
              </RNTouchableOpacity>
              {showDatePicker && (
                <Modal
                  visible={showDatePicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDatePicker(false)}
                >
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <View style={{ backgroundColor: '#2E3130', borderRadius: 18, padding: 24, width: '85%', alignItems: 'center', elevation: 8 }}>
                      <DateTimePicker
                        value={tempDate || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                        style={{ width: '100%' }}
                      />
                      <View row spread marginT-s4 style={{ width: '100%' }}>
                        <Button
                          label="تأكيد"
                          backgroundColor="#4CCCE6"
                          style={{ paddingVertical: 12, paddingHorizontal: 24, marginRight: 8 }}
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
                        <Button
                          label="إلغاء"
                          backgroundColor="#202221"
                          style={{ paddingVertical: 12, paddingHorizontal: 24 }}
                          onPress={() => {
                            setShowDatePicker(false);
                            setTempDate(null);
                          }}
                          labelStyle={{ color: '#4CCCE6', fontFamily: 'ReadexPro-SemiBold', fontSize: 16 }}
                        />
                      </View>
                    </View>
                  </View>
                </Modal>
              )}
              {errors.dateOfBirth && (
                <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.dateOfBirth}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>الجنس</Text>
              <View row spread style={{ gap: 12, flexDirection: 'row-reverse' }}>
                <RNTouchableOpacity
                  style={{
                    flex: 1,
                    height: 48,
                    borderWidth: 1,
                    borderColor: '#045468',
                    backgroundColor: formData.gender === 'male' ? '#045468' : '#fff',
                    borderRadius: 20,
                    paddingVertical: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'male' });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <MaterialIcons
                    name="male"
                    size={20}
                    color={formData.gender === 'male' ? '#fff' : '#045468'}
                  />
                  <Text
                    text70
                    style={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.gender === 'male' ? '#fff' : '#045468',
                    }}
                  >
                    ذكر
                  </Text>
                </RNTouchableOpacity>

                <RNTouchableOpacity
                  style={{
                    flex: 1,
                    height: 48,
                    borderWidth: 1,
                    borderColor: '#045468',
                    backgroundColor: formData.gender === 'female' ? '#045468' : '#fff',
                    borderRadius: 20,
                    paddingVertical: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'female' });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <MaterialIcons
                    name="female"
                    size={20}
                    color={formData.gender === 'female' ? '#fff' : '#045468'}
                  />
                  <Text
                    text70
                    style={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.gender === 'female' ? '#fff' : '#045468',
                    }}
                  >
                    أنثى
                  </Text>
                </RNTouchableOpacity>
              </View>
              {errors.gender && (
                <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.gender}</Text>
              )}
            </View>

            {/* Medical Survey Section */}
            <View marginT-s6 marginB-s4 paddingB-s2 style={{ borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text text60 zimam-primary center style={{ fontFamily: 'ReadexPro-Bold' }}>الاستبيان الطبي</Text>
            </View>

            <View style={{ gap: 16 }}>
              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت مصاب بالسكري؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: formData.isDiabetic ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isDiabetic: true })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: formData.isDiabetic ? '#ECEDEE' : '#045468',
                      }}
                    >
                      نعم
                    </Text>
                  </RNTouchableOpacity>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: !formData.isDiabetic ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isDiabetic: false })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: !formData.isDiabetic ? '#ECEDEE' : '#045468',
                      }}
                    >
                      لا
                    </Text>
                  </RNTouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت مصاب بارتفاع ضغط الدم؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: formData.isHypertensive ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isHypertensive: true })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: formData.isHypertensive ? '#ECEDEE' : '#045468',
                      }}
                    >
                      نعم
                    </Text>
                  </RNTouchableOpacity>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: !formData.isHypertensive ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isHypertensive: false })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: !formData.isHypertensive ? '#ECEDEE' : '#045468',
                      }}
                    >
                      لا
                    </Text>
                  </RNTouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت مصاب بارتفاع في الكوليسترول؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: formData.isCholesterol ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isCholesterol: true })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: formData.isCholesterol ? '#ECEDEE' : '#045468',
                      }}
                    >
                      نعم
                    </Text>
                  </RNTouchableOpacity>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: !formData.isCholesterol ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isCholesterol: false })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: !formData.isCholesterol ? '#ECEDEE' : '#045468',
                      }}
                    >
                      لا
                    </Text>
                  </RNTouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت نشط جنسياً؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: formData.isSmoker ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isSmoker: true })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: formData.isSmoker ? '#ECEDEE' : '#045468',
                      }}
                    >
                      نعم
                    </Text>
                  </RNTouchableOpacity>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: !formData.isSmoker ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isSmoker: false })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: !formData.isSmoker ? '#ECEDEE' : '#045468',
                      }}
                    >
                      لا
                    </Text>
                  </RNTouchableOpacity>
                </View>
              </View>

              {formData.isSmoker && (
                <View style={{ gap: 12 }}>
                  <RNTextInput
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
                  <RNTextInput
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
                    <View style={{ backgroundColor: '#2E3130', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#045468' }}>
                      <Text text80 style={{ fontFamily: 'ReadexPro-SemiBold', color: '#999', textAlign: 'right' }}>سنوات التدخين (Pack-Years):</Text>
                      <Text text60 style={{ fontFamily: 'ReadexPro-Bold', color: '#045468', textAlign: 'right' }}>{calculatePackYears(formData.smokingDetails)}</Text>
                    </View>
                  )}
                </View>
              )}

              <View marginB-s4>
                <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>الطول (سم)</Text>
                <RNTextInput
                  style={{
                    height: 48,
                    borderWidth: 1,
                    borderColor: errors.height ? '#ef4444' : '#555',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    fontFamily: 'ReadexPro',
                    backgroundColor: '#202221',
                    color: '#ECEDEE',
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                  value={formData.height}
                  onChangeText={(text) => {
                    setFormData({ ...formData, height: text });
                    if (errors.height) {
                      setErrors({ ...errors, height: undefined });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="أدخل طولك"
                  placeholderTextColor="#999"
                />
                {errors.height && <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.height}</Text>}
              </View>

              <View marginB-s4>
                <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>الوزن (كجم)</Text>
                <RNTextInput
                  style={{
                    height: 48,
                    borderWidth: 1,
                    borderColor: errors.weight ? '#ef4444' : '#555',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    fontFamily: 'ReadexPro',
                    backgroundColor: '#202221',
                    color: '#ECEDEE',
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  }}
                  value={formData.weight}
                  onChangeText={(text) => {
                    setFormData({ ...formData, weight: text });
                    if (errors.weight) {
                      setErrors({ ...errors, weight: undefined });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="أدخل وزنك"
                  placeholderTextColor="#999"
                />
                {errors.weight && <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.weight}</Text>}
              </View>

              {/* BMI Display */}
              {formData.height && formData.weight && (
                <View style={{ backgroundColor: '#2E3130', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#045468' }}>
                  <Text text80 style={{ fontFamily: 'ReadexPro-SemiBold', color: '#999', textAlign: 'right' }}>مؤشر كتلة الجسم (BMI):</Text>
                  <Text text60 style={{ fontFamily: 'ReadexPro-Bold', color: '#045468', textAlign: 'right' }}>
                    {calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)).toFixed(1)}
                  </Text>
                  <Text text80 style={{ fontFamily: 'ReadexPro', color: '#ECEDEE', textAlign: 'right', width: '100%' }}>
                    {getBMICategory(calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)))}</Text>
                </View>
              )}

              {formData.gender === 'female' && (
                <View style={{ gap: 8 }}>
                  <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت حامل؟</Text>
                  <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                    <RNTouchableOpacity
                      style={{
                        flex: 1,
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#045468',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: formData.isPregnant ? '#045468' : 'transparent',
                      }}
                      onPress={() => setFormData({ ...formData, isPregnant: true })}
                    >
                      <Text
                        text70
                        style={{
                          fontFamily: 'ReadexPro-Bold',
                          color: formData.isPregnant ? '#ECEDEE' : '#045468',
                        }}
                      >
                        نعم
                      </Text>
                    </RNTouchableOpacity>
                    <RNTouchableOpacity
                      style={{
                        flex: 1,
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#045468',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: !formData.isPregnant ? '#045468' : 'transparent',
                      }}
                      onPress={() => setFormData({ ...formData, isPregnant: false })}
                    >
                      <Text
                        text70
                        style={{
                          fontFamily: 'ReadexPro-Bold',
                          color: !formData.isPregnant ? '#ECEDEE' : '#045468',
                        }}
                      >
                        لا
                      </Text>
                    </RNTouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت نشط جنسياً؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: formData.isSexuallyActive ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isSexuallyActive: true })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: formData.isSexuallyActive ? '#ECEDEE' : '#045468',
                      }}
                    >
                      نعم
                    </Text>
                  </RNTouchableOpacity>
                  <RNTouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderWidth: 1,
                      borderColor: '#045468',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: !formData.isSexuallyActive ? '#045468' : 'transparent',
                    }}
                    onPress={() => setFormData({ ...formData, isSexuallyActive: false })}
                  >
                    <Text
                      text70
                      style={{
                        fontFamily: 'ReadexPro-Bold',
                        color: !formData.isSexuallyActive ? '#ECEDEE' : '#045468',
                      }}
                    >
                      لا
                    </Text>
                  </RNTouchableOpacity>
                </View>
              </View>

              {formData.isSexuallyActive && (
                <View marginB-s4>
                  <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>عدد الشركاء</Text>
                  <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                    <RNTouchableOpacity
                      style={{
                        flex: 1,
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#045468',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: formData.sexualActivityDetails?.partnerCount === 'single' ? '#045468' : 'transparent',
                      }}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          sexualActivityDetails: { ...formData.sexualActivityDetails, partnerCount: 'single' },
                        })
                      }
                    >
                      <Text
                        text70
                        style={{
                          fontFamily: 'ReadexPro-Bold',
                          color: formData.sexualActivityDetails?.partnerCount === 'single' ? '#ECEDEE' : '#045468',
                        }}
                      >
                        شريك واحد
                      </Text>
                    </RNTouchableOpacity>
                    <RNTouchableOpacity
                      style={{
                        flex: 1,
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#045468',
                        borderRadius: 8,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: formData.sexualActivityDetails?.partnerCount === 'multiple' ? '#045468' : 'transparent',
                      }}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          sexualActivityDetails: { ...formData.sexualActivityDetails, partnerCount: 'multiple' },
                        })
                      }
                    >
                      <Text
                        text70
                        style={{
                          fontFamily: 'ReadexPro-Bold',
                          color: formData.sexualActivityDetails?.partnerCount === 'multiple' ? '#ECEDEE' : '#045468',
                        }}
                      >
                        أكثر من شريك
                      </Text>
                    </RNTouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <RNTouchableOpacity
              style={{
                backgroundColor: isSubmitting ? '#666' : '#045468',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 24,
              }}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text text70 white style={{ fontFamily: 'ReadexPro-Bold' }}>حفظ البيانات</Text>
              )}
            </RNTouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

 