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

interface SignupFormData {
  name: string;
  email: string;
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
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
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
      const response = await apiRequest<UserType>('POST', '/api/users', userData);
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
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        dateOfBirth: selectedDate.toISOString().split('T')[0],
      });
      if (errors.dateOfBirth) {
        setErrors({ ...errors, dateOfBirth: undefined });
      }
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
            <Text style={styles.title}>مرحباً بك في تذكير الفحوصات الصحية</Text>
            <Text style={styles.subtitle}>
              احصل على تذكيرات فحوصات طبية شخصية تناسب عمرك وجنسك
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>الاسم الكامل</Text>
              <TextInput
                style={[
                  styles.input,
                  I18nManager.isRTL && { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' },
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
                editable={!createUserMutation.isPending}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>البريد الإلكتروني</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
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
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                editable={!createUserMutation.isPending}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>كلمة المرور</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
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
                secureTextEntry
                textContentType="password"
                editable={!createUserMutation.isPending}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>تأكيد كلمة المرور</Text>
              <TextInput
                style={[
                  styles.input,
                  { textAlign: I18nManager.isRTL ? 'right' : 'left' },
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
                secureTextEntry
                textContentType="password"
                editable={!createUserMutation.isPending}
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>الجنس</Text>
              <View style={[styles.genderContainer, I18nManager.isRTL && { flexDirection: 'row-reverse' }]}>
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>تاريخ الميلاد</Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  I18nManager.isRTL && { alignSelf: 'flex-end' },
                  errors.dateOfBirth && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={createUserMutation.isPending}
              >
                <Text style={I18nManager.isRTL && { textAlign: 'right', writingDirection: 'rtl' }}>
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'اختر تاريخ الميلاد'}
                </Text>
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

            {/* Medical Survey Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الاستبيان الطبي</Text>
            </View>

            <View style={styles.medicalSurveyContainer}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isDiabetic: !formData.isDiabetic })}
                >
                  {formData.isDiabetic && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>هل أنت مصاب بالسكري؟</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isHypertensive: !formData.isHypertensive })}
                >
                  {formData.isHypertensive && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>هل أنت مصاب بارتفاع ضغط الدم؟</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isCholesterol: !formData.isCholesterol })}
                >
                  {formData.isCholesterol && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>هل أنت مصاب بارتفاع في الكوليسترول؟</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isSmoker: !formData.isSmoker })}
                >
                  {formData.isSmoker && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>هل أنت مدخن؟</Text>
              </View>

              {formData.isSmoker && (
                <View style={styles.smokingDetailsContainer}>
                  <TextInput
                    style={[styles.input, errors.smokingDetails?.amount && styles.inputError]}
                    placeholder="كم عدد السجائر في اليوم؟"
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
                  />
                  <TextInput
                    style={[styles.input, errors.smokingDetails?.duration && styles.inputError]}
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
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>الطول (سم)</Text>
                <TextInput
                  style={[styles.input, errors.height && styles.inputError]}
                  value={formData.height}
                  onChangeText={(text) => {
                    setFormData({ ...formData, height: text });
                    if (errors.height) {
                      setErrors({ ...errors, height: undefined });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="أدخل طولك"
                />
                {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>الوزن (كجم)</Text>
                <TextInput
                  style={[styles.input, errors.weight && styles.inputError]}
                  value={formData.weight}
                  onChangeText={(text) => {
                    setFormData({ ...formData, weight: text });
                    if (errors.weight) {
                      setErrors({ ...errors, weight: undefined });
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="أدخل وزنك"
                />
                {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
              </View>

              {/* BMI Display */}
              {formData.height && formData.weight && (
                <View style={styles.bmiContainer}>
                  <Text style={styles.bmiLabel}>مؤشر كتلة الجسم (BMI):</Text>
                  <Text style={styles.bmiValue}>
                    {calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)).toFixed(1)}
                  </Text>
                  <Text style={styles.bmiCategory}>
                    {getBMICategory(calculateBMI(parseFloat(formData.height), parseFloat(formData.weight)))}
                  </Text>
                </View>
              )}

              {formData.gender === 'female' && (
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => setFormData({ ...formData, isPregnant: !formData.isPregnant })}
                  >
                    {formData.isPregnant && <MaterialIcons name="check" size={20} color="#008553" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>هل أنت حامل؟</Text>
                </View>
              )}

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isSexuallyActive: !formData.isSexuallyActive })}
                >
                  {formData.isSexuallyActive && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>هل أنت نشط جنسياً؟</Text>
              </View>

              {formData.isSexuallyActive && (
                <View style={styles.partnerCountContainer}>
                  <Text style={styles.label}>عدد الشركاء</Text>
                  <View style={styles.partnerCountButtons}>
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

            {showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

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
  dateInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dateInputText: {
    fontSize: 16,
    color: '#333',
  },
  dateInputPlaceholder: {
    color: '#999',
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008553',
  },
  medicalSurveyContainer: {
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
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
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  bmiLabel: {
    fontSize: 16,
    color: '#008553',
    fontWeight: '600',
  },
  bmiValue: {
    fontSize: 24,
    color: '#008553',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  bmiCategory: {
    fontSize: 14,
    color: '#666',
  },
}); 