import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>مرحباً بك في بكّر</Text>
            <Text style={styles.subtitle}>
              بكّر بالفحص واكتشف جميع الفحوصات المناسبة لك
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الاسم الكامل</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right', writingDirection: 'rtl' },
                  errors.name && styles.inputError,
                ]}
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
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>تاريخ الميلاد</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  errors.dateOfBirth && styles.inputError,
                ]}
                onPress={() => {
                  setTempDate(formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date());
                  setShowDatePicker(true);
                }}
              >
                <Text style={{ color: formData.dateOfBirth ? '#374151' : '#888', textAlign: 'right' }}>
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
                <View style={styles.datePickerOverlay}>
                  <View style={styles.datePickerModalBox}>
                    <DateTimePicker
                      value={tempDate || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                      style={{ width: '100%' }}
                    />
                    <View style={styles.datePickerActionsRow}>
                      <TouchableOpacity
                        style={styles.confirmButton}
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
                      >
                        <Text style={styles.confirmButtonText}>تأكيد</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelDateButton}
                        onPress={() => {
                          setShowDatePicker(false);
                          setTempDate(null);
                        }}
                      >
                        <Text style={styles.cancelDateButtonText}>إلغاء</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>البريد الإلكتروني</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right', writingDirection: 'rtl' },
                  errors.email && styles.inputError,
                ]}
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
                <Text style={styles.errorText}>{errors.email}</Text>
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

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>كلمة المرور</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right', writingDirection: 'rtl' },
                  errors.password && styles.inputError,
                ]}
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
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>تأكيد كلمة المرور</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: 'right', writingDirection: 'rtl' },
                  errors.confirmPassword && styles.inputError,
                ]}
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
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الجنس</Text>
              <View style={[styles.genderContainer, { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'male' && styles.genderButtonSelected,
                  ]}
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
                    color={formData.gender === 'male' ? '#fff' : '#008553'}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      formData.gender === 'male' && styles.genderButtonTextSelected,
                    ]}
                  >
                    ذكر
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'female' && styles.genderButtonSelected,
                  ]}
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
                    color={formData.gender === 'female' ? '#fff' : '#008553'}
                  />
                  <Text
                    style={[
                      styles.genderButtonText,
                      formData.gender === 'female' && styles.genderButtonTextSelected,
                    ]}
                  >
                    أنثى
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>

            {/* Medical Survey Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الاستبيان الطبي</Text>
            </View>

            <View style={styles.medicalSurveyContainer}>
              <View style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل أنت مصاب بالسكري؟</Text>
                <View style={[styles.yesNoContainer, { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      formData.isDiabetic && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isDiabetic: true })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        formData.isDiabetic && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      نعم
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      !formData.isDiabetic && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isDiabetic: false })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        !formData.isDiabetic && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      لا
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل أنت مصاب بارتفاع ضغط الدم؟</Text>
                <View style={[styles.yesNoContainer, { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      formData.isHypertensive && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isHypertensive: true })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        formData.isHypertensive && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      نعم
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      !formData.isHypertensive && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isHypertensive: false })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        !formData.isHypertensive && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      لا
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل أنت مصاب بارتفاع في الكوليسترول؟</Text>
                <View style={[styles.yesNoContainer, { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      formData.isCholesterol && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isCholesterol: true })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        formData.isCholesterol && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      نعم
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      !formData.isCholesterol && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isCholesterol: false })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        !formData.isCholesterol && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      لا
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل أنت مدخن؟</Text>
                <View style={[styles.yesNoContainer, { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      formData.isSmoker && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isSmoker: true })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        formData.isSmoker && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      نعم
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      !formData.isSmoker && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isSmoker: false })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        !formData.isSmoker && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      لا
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {formData.isSmoker && (
                <View style={styles.smokingDetailsContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: 'right', writingDirection: 'rtl' },
                      errors.smokingDetails?.amount && styles.inputError,
                    ]}
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
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: 'right', writingDirection: 'rtl' },
                      errors.smokingDetails?.duration && styles.inputError,
                    ]}
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
                    <View style={[styles.metricBox, styles.packYearsBox]}>
                      <Text style={[styles.metricLabel, styles.packYearsLabel]}>سنوات التدخين (Pack-Years):</Text>
                      <Text style={[styles.metricValue, styles.packYearsValue]}>{calculatePackYears(formData.smokingDetails)}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الطول (سم)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: 'right', writingDirection: 'rtl' },
                    errors.height && styles.inputError,
                  ]}
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
                {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الوزن (كجم)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: 'right', writingDirection: 'rtl' },
                    errors.weight && styles.inputError,
                  ]}
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
                {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
              </View>

              {/* BMI Display */}
              {formData.height && formData.weight && (
                <View style={[styles.metricBox, styles.bmiContainer]}>
                  <Text style={[styles.metricLabel, styles.bmiLabel]}>مؤشر كتلة الجسم (BMI):</Text>
                  <Text style={[styles.metricValue, styles.bmiValue]}>
                    {calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)).toFixed(1)}
                  </Text>
                  <Text style={[styles.bmiCategory, { textAlign: 'right', width: '100%' }]}>
                    {getBMICategory(calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)))}</Text>
                </View>
              )}

              {formData.gender === 'female' && (
                <View style={styles.questionContainer}>
                  <Text style={[styles.questionLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل أنت حامل؟</Text>
                  <View style={[styles.yesNoContainer, { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[
                        styles.yesNoButton,
                        formData.isPregnant && styles.yesNoButtonSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, isPregnant: true })}
                    >
                      <Text
                        style={[
                          styles.yesNoButtonText,
                          formData.isPregnant && styles.yesNoButtonTextSelected,
                        ]}
                      >
                        نعم
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.yesNoButton,
                        !formData.isPregnant && styles.yesNoButtonSelected,
                      ]}
                      onPress={() => setFormData({ ...formData, isPregnant: false })}
                    >
                      <Text
                        style={[
                          styles.yesNoButtonText,
                          !formData.isPregnant && styles.yesNoButtonTextSelected,
                        ]}
                      >
                        لا
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.questionContainer}>
                <Text style={[styles.questionLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل أنت نشط جنسياً؟</Text>
                <View style={[styles.yesNoContainer, { flexDirection: 'row-reverse' }]}>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      formData.isSexuallyActive && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isSexuallyActive: true })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        formData.isSexuallyActive && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      نعم
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.yesNoButton,
                      !formData.isSexuallyActive && styles.yesNoButtonSelected,
                    ]}
                    onPress={() => setFormData({ ...formData, isSexuallyActive: false })}
                  >
                    <Text
                      style={[
                        styles.yesNoButtonText,
                        !formData.isSexuallyActive && styles.yesNoButtonTextSelected,
                      ]}
                    >
                      لا
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {formData.isSexuallyActive && (
                <View style={styles.partnerCountContainer}>
                  <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>عدد الشركاء</Text>
                  <View style={[styles.partnerCountButtons, { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[
                        styles.partnerCountButton,
                        formData.sexualActivityDetails?.partnerCount === 'single' && styles.partnerCountButtonSelected,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          sexualActivityDetails: { ...formData.sexualActivityDetails, partnerCount: 'single' },
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.partnerCountButtonText,
                          formData.sexualActivityDetails?.partnerCount === 'single' && styles.partnerCountButtonTextSelected,
                        ]}
                      >
                        شريك واحد
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.partnerCountButton,
                        formData.sexualActivityDetails?.partnerCount === 'multiple' && styles.partnerCountButtonSelected,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          sexualActivityDetails: { ...formData.sexualActivityDetails, partnerCount: 'multiple' },
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.partnerCountButtonText,
                          formData.sexualActivityDetails?.partnerCount === 'multiple' && styles.partnerCountButtonTextSelected,
                        ]}
                      >
                        أكثر من شريك
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                createUserMutation.isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>ابدأ</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
              disabled={createUserMutation.isPending}
            >
              <Text style={styles.loginButtonText}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
    paddingTop: 32,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008553',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#008553',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  genderButtonSelected: {
    backgroundColor: '#008553',
  },
  genderButtonText: {
    fontSize: 16,
    color: '#008553',
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  questionContainer: {
    gap: 8,
    width: '100%',
  },
  questionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#008553',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  yesNoButtonSelected: {
    backgroundColor: '#008553',
  },
  yesNoButtonText: {
    fontSize: 16,
    color: '#008553',
  },
  yesNoButtonTextSelected: {
    color: '#fff',
  },
  datePickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModalBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  confirmButton: {
    backgroundColor: '#008553',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelDateButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelDateButtonText: {
    color: '#008553',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    height: 48,
    backgroundColor: '#008553',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#008553',
    fontSize: 16,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008553',
    textAlign: 'center',
    alignSelf: 'center',
  },
  medicalSurveyContainer: {
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#008553',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  smokingDetailsContainer: {
    gap: 8,
    marginLeft: 32,
  },
  partnerCountContainer: {
    marginLeft: 32,
    gap: 8,
  },
  partnerCountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  partnerCountButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#008553',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  partnerCountButtonSelected: {
    backgroundColor: '#008553',
  },
  partnerCountButtonText: {
    fontSize: 14,
    color: '#008553',
  },
  partnerCountButtonTextSelected: {
    color: '#fff',
  },
  bmiContainer: {
    backgroundColor: '#f0fdf4',
  },
  bmiLabel: {
    color: '#008553',
  },
  bmiValue: {
    color: '#008553',
    marginVertical: 4,
  },
  bmiCategory: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    width: '100%',
  },
  metricBox: {
    width: '100%',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    alignItems: 'flex-start',
    alignSelf: 'flex-end',
  },
  metricLabel: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'right',
    width: '100%',
  },
  metricValue: {
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
    textAlign: 'right',
    width: '100%',
  },
  packYearsBox: {
    backgroundColor: '#fffbe6',
  },
  packYearsLabel: {
    color: '#bfa100',
  },
  packYearsValue: {
    color: '#bfa100',
  },
}); 