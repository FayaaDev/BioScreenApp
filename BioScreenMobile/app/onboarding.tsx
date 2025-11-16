import React, { useState } from 'react';
import {
  TextInput as RNTextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
  Pressable,
  Modal,
} from 'react-native';
import { View, Text, Card, Button, TouchableOpacity } from 'react-native-ui-lib';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useToast } from '../hooks/useToast';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as UserType } from '../types/api';
import { IconSymbol } from '../components/ui/IconSymbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PhoneNumberInput, validatePhoneNumber } from '../components/PhoneNumberInput';

interface SignupFormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
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
  name?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
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
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    phoneNumber: '+966',
    password: '',
    confirmPassword: '',
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

  const createUserMutation = useMutation({
    mutationFn: async (userData: Omit<SignupFormData, 'confirmPassword'>) => {
      // Normalize email: trim whitespace, convert to lowercase, remove RTL markers
      const normalizedEmail = userData.email
        .trim()
        .toLowerCase()
        .replace(/[\u200E\u200F\u202A-\u202E]/g, ''); // Remove RTL/LTR marks
      
      const response = await apiRequest<UserType>('POST', '/api/users', {
        ...userData,
        email: normalizedEmail,
      });
      return response;
    },
    onSuccess: (user) => {
      AsyncStorage.setItem('healthscreen_user_id', user.id.toString());
      showToast({
        title: 'مرحباً بك',
        description: 'تم إنشاء حسابك بنجاح',
        type: 'success',
      });
      router.push('/');
    },
    onError: () => {
      showToast({
        title: 'خطأ',
        description: 'فشل في إنشاء حسابك. حاول مرة أخرى',
        type: 'error',
      });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name) {
      newErrors.name = 'الرجاء إدخال الاسم الكامل';
    }

    if (!formData.email) {
      newErrors.email = 'الرجاء إدخال البريد الإلكتروني';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'الرجاء إدخال بريد إلكتروني صحيح';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'الرجاء إدخال رقم الهاتف';
    } else {
      const phoneError = validatePhoneNumber(formData.phoneNumber);
      if (phoneError) {
        newErrors.phoneNumber = phoneError;
      }
    }

    if (!formData.password) {
      newErrors.password = 'الرجاء إدخال كلمة المرور';
    } else if (formData.password.length < 6) {
      newErrors.password = 'يجب أن تكون كلمة المرور 6 أحرف على الأقل';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'الرجاء تأكيد كلمة المرور';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

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

  const handleSubmit = () => {
    if (validateForm()) {
      const { confirmPassword, ...userData } = formData;
      createUserMutation.mutate(userData);
    }
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
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>الاسم الكامل</Text>
              <RNTextInput
                style={{ height: 48, borderWidth: 1, borderColor: errors.name ? '#ef4444' : '#555', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, fontFamily: 'ReadexPro', backgroundColor: '#202221', color: '#ECEDEE', textAlign: 'right', writingDirection: 'rtl' }}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) {
                    setErrors({ ...errors, name: undefined });
                  }
                }}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor="#999"
                editable={!createUserMutation.isPending}
              />
              {errors.name && (
                <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.name}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>تاريخ الميلاد</Text>
              <TouchableOpacity
                paddingH-s4
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
              </TouchableOpacity>
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
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>البريد الإلكتروني</Text>
              <RNTextInput
                style={{ height: 48, borderWidth: 1, borderColor: errors.email ? '#ef4444' : '#555', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, fontFamily: 'ReadexPro', backgroundColor: '#202221', color: '#ECEDEE', textAlign: 'right', writingDirection: 'rtl' }}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text });
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                placeholder="أدخل بريدك الإلكتروني"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!createUserMutation.isPending}
              />
              {errors.email && (
                <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.email}</Text>
              )}
            </View>

            <PhoneNumberInput
              value={formData.phoneNumber}
              onChangeText={(text) => {
                setFormData({ ...formData, phoneNumber: text });
                if (errors.phoneNumber) {
                  setErrors({ ...errors, phoneNumber: undefined });
                }
              }}
              error={errors.phoneNumber}
              editable={!createUserMutation.isPending}
              required={true}
            />

            <View marginB-s4>
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>كلمة المرور</Text>
              <RNTextInput
                style={{ height: 48, borderWidth: 1, borderColor: errors.password ? '#ef4444' : '#555', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, fontFamily: 'ReadexPro', backgroundColor: '#202221', color: '#ECEDEE', textAlign: 'right', writingDirection: 'rtl' }}
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#999"
                secureTextEntry
                textContentType="password"
                editable={!createUserMutation.isPending}
              />
              {errors.password && (
                <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.password}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>تأكيد كلمة المرور</Text>
              <RNTextInput
                style={{ height: 48, borderWidth: 1, borderColor: errors.confirmPassword ? '#ef4444' : '#555', borderRadius: 8, paddingHorizontal: 16, fontSize: 16, fontFamily: 'ReadexPro', backgroundColor: '#202221', color: '#ECEDEE', textAlign: 'right', writingDirection: 'rtl' }}
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, confirmPassword: text });
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                placeholder="أعد إدخال كلمة المرور"
                placeholderTextColor="#999"
                secureTextEntry
                textContentType="password"
                editable={!createUserMutation.isPending}
              />
              {errors.confirmPassword && (
                <Text color="error" text80 style={{ fontFamily: 'ReadexPro' }}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View marginB-s4>
              <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>الجنس</Text>
              <View row spread style={{ gap: 12, flexDirection: 'row-reverse' }}>
                <TouchableOpacity
                  flex
                  center
                  br20
                  paddingV-s3
                  style={{
                    height: 48,
                    borderWidth: 1,
                    borderColor: '#045468',
                    backgroundColor: formData.gender === 'male' ? '#045468' : '#fff',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'male' });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  disabled={createUserMutation.isPending}
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
                </TouchableOpacity>

                <TouchableOpacity
                  flex
                  center
                  br20
                  paddingV-s3
                  style={{
                    height: 48,
                    borderWidth: 1,
                    borderColor: '#045468',
                    backgroundColor: formData.gender === 'female' ? '#045468' : '#fff',
                    flexDirection: 'row',
                    gap: 8,
                  }}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'female' });
                    if (errors.gender) {
                      setErrors({ ...errors, gender: undefined });
                    }
                  }}
                  disabled={createUserMutation.isPending}
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
                </TouchableOpacity>
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
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت مصاب بارتفاع ضغط الدم؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت مصاب بارتفاع في الكوليسترول؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت نشط جنسياً؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
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
                    <TouchableOpacity
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
                    </TouchableOpacity>
                    <TouchableOpacity
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
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ gap: 8 }}>
                <Text text70 white style={{ fontFamily: 'ReadexPro-Medium', textAlign: 'right', alignSelf: 'flex-end' }}>هل أنت نشط جنسياً؟</Text>
                <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                  <TouchableOpacity
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
                  </TouchableOpacity>
                </View>
              </View>

              {formData.isSexuallyActive && (
                <View marginB-s4>
                  <Text text70 white style={{ fontFamily: 'ReadexPro-SemiBold', textAlign: 'right', alignSelf: 'flex-end', marginBottom: 8 }}>عدد الشركاء</Text>
                  <View style={{ gap: 12, flexDirection: 'row-reverse' }}>
                    <TouchableOpacity
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
                    </TouchableOpacity>
                    <TouchableOpacity
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
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: createUserMutation.isPending ? '#666' : '#045468',
                paddingVertical: 16,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 24,
              }}
              onPress={handleSubmit}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text text70 white style={{ fontFamily: 'ReadexPro-Bold' }}>ابدأ</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              center
              paddingV-s3
              onPress={() => router.push('/login')}
              disabled={createUserMutation.isPending}
            >
              <Text text80 zimam-primary style={{ fontFamily: 'ReadexPro' }}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

 