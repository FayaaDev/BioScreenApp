import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  I18nManager,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useToast } from '../hooks/useToast';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
  // Medical survey fields
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

export function FamilyManagement({ userId, onSwitchPerson }: { userId: string; onSwitchPerson?: (id: string) => void }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    gender: '',
    dateOfBirth: '',
    // Medical survey fields
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
      partnerCount: 'single' as 'single' | 'multiple',
    },
  });
  const [isRTL] = useState(I18nManager.isRTL);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: familyMembers, isLoading } = useQuery<FamilyMember[]>({
    queryKey: ['/api/users', userId, 'family'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/family`),
    enabled: !!userId,
  });

  const createFamilyMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', `/api/users/${userId}/family`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'family'] });
      setIsModalOpen(false);
      setEditingMember(null);
      resetForm();
      showToast({ title: 'تمت إضافة فرد العائلة', type: 'success' });
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل في إضافة فرد العائلة', type: 'error' });
    },
  });

  const updateFamilyMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      return apiRequest('PATCH', `/api/family/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'family'] });
      setEditingMember(null);
      setIsModalOpen(false);
      resetForm();
      showToast({ title: 'تم تحديث فرد العائلة', type: 'success' });
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل في تحديث فرد العائلة', type: 'error' });
    },
  });

  const deleteFamilyMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/family/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'family'] });
      showToast({ title: 'تم حذف فرد العائلة', type: 'success' });
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل في حذف فرد العائلة', type: 'error' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
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
    setSubmitAttempted(false);
    setValidationErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الرجاء إدخال الاسم';
    }

    if (!formData.relationship.trim()) {
      newErrors.relationship = 'الرجاء إدخال القرابة';
    }

    if (!formData.gender) {
      newErrors.gender = 'الرجاء اختيار الجنس';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'الرجاء إدخال تاريخ الميلاد';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120); // Maximum age of 120 years

      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = 'تاريخ الميلاد غير صالح';
      } else if (birthDate > today) {
        newErrors.dateOfBirth = 'تاريخ الميلاد لا يمكن أن يكون في المستقبل';
      } else if (birthDate < minDate) {
        newErrors.dateOfBirth = 'تاريخ الميلاد غير منطقي';
      }
    }

    if (!formData.height.trim()) {
      newErrors.height = 'الرجاء إدخال الطول';
    } else if (isNaN(parseFloat(formData.height)) || parseFloat(formData.height) <= 0) {
      newErrors.height = 'الرجاء إدخال طول صحيح';
    }

    if (!formData.weight.trim()) {
      newErrors.weight = 'الرجاء إدخال الوزن';
    } else if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'الرجاء إدخال وزن صحيح';
    }

    if (formData.isSmoker) {
      if (!formData.smokingDetails?.amount) {
        newErrors.smokingAmount = 'الرجاء تحديد كمية التدخين';
      } else if (isNaN(parseFloat(formData.smokingDetails.amount)) || parseFloat(formData.smokingDetails.amount) <= 0) {
        newErrors.smokingAmount = 'الرجاء إدخال كمية صحيحة';
      }

      if (!formData.smokingDetails?.duration) {
        newErrors.smokingDuration = 'الرجاء تحديد مدة التدخين';
      } else if (isNaN(parseFloat(formData.smokingDetails.duration)) || parseFloat(formData.smokingDetails.duration) <= 0) {
        newErrors.smokingDuration = 'الرجاء إدخال مدة صحيحة';
      }
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!validateForm()) {
      return;
    }
    if (editingMember) {
      updateFamilyMemberMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createFamilyMemberMutation.mutate(formData);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      isDiabetic: member.isDiabetic ?? false,
      isHypertensive: member.isHypertensive ?? false,
      isCholesterol: member.isCholesterol ?? false,
      isSmoker: member.isSmoker ?? false,
      smokingDetails: member.smokingDetails ?? { amount: '', duration: '' },
      height: member.height ?? '',
      weight: member.weight ?? '',
      isPregnant: member.isPregnant ?? false,
      isSexuallyActive: member.isSexuallyActive ?? false,
      sexualActivityDetails: member.sexualActivityDetails ?? { partnerCount: 'single' },
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف فرد العائلة هذا؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteFamilyMemberMutation.mutate(id) },
    ]);
  };

  const handleSwitch = async (id: string) => {
    await AsyncStorage.setItem('selectedPersonId', id);
    if (onSwitchPerson) onSwitchPerson(id);
    showToast({ title: 'تم التبديل', type: 'info' });
  };

  const calculateBMI = (height: string, weight: string): number | null => {
    const heightCm = parseFloat(height);
    const weightKg = parseFloat(weight);
    if (isNaN(heightCm) || isNaN(weightKg) || heightCm <= 0 || weightKg <= 0) {
      return null;
    }
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
    <View style={styles.card}>
      <Text style={styles.title}>إدارة العائلة</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#008553" />
      ) : (
        <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 12 }}>
          {(!familyMembers || familyMembers.length === 0) ? (
            <Text style={styles.emptyText}>لا يوجد أفراد عائلة</Text>
          ) : (
            familyMembers.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <TouchableOpacity style={styles.memberInfo} onPress={() => handleSwitch(member.id.toString())}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberDetails}>{member.relationship} • {member.gender === 'male' ? 'ذكر' : 'أنثى'}</Text>
                  <Text style={styles.memberDetails}>تاريخ الميلاد: {member.dateOfBirth}</Text>
                  {member.isSmoker && member.smokingDetails && (
                    <View style={styles.packYearsBox}>
                      <Text style={[styles.packYearsLabel, { textAlign: 'right', width: '100%' }]}>سنوات التدخين (Pack-Years):</Text>
                      <Text style={[styles.packYearsValue, { textAlign: 'right', width: '100%' }]}>{calculatePackYears(member.smokingDetails)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.memberActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(member)}>
                    <Text style={styles.editButtonText}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(member.id)}>
                    <Text style={styles.deleteButtonText}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <TouchableOpacity
        style={[styles.addButton, familyMembers && familyMembers.length >= 5 && { opacity: 0.5 }]}
        disabled={familyMembers && familyMembers.length >= 5}
        onPress={() => {
          if (familyMembers && familyMembers.length >= 5) {
            showToast({ title: 'الحد الأقصى', description: 'يمكنك إضافة 5 أفراد فقط لكل حساب', type: 'error' });
            return;
          }
          setEditingMember(null);
          resetForm();
          setIsModalOpen(true);
        }}
      >
        <Text style={styles.addButtonText}>إضافة فرد للعائلة</Text>
      </TouchableOpacity>
      {familyMembers && familyMembers.length >= 5 && (
        <Text style={{ color: '#ef4444', marginTop: 8, textAlign: 'center', fontWeight: 'bold' }}>
          لا يمكنك إضافة أكثر من 5 أفراد للعائلة
        </Text>
      )}
      {/* Modal for add/edit */}
      <Modal visible={isModalOpen} animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalContainer}>
            <ScrollView 
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            <Text style={styles.modalTitle}>{editingMember ? 'تعديل فرد العائلة' : 'إضافة فرد للعائلة'}</Text>
            <TextInput
              style={[
                styles.input,
                { textAlign: 'right', writingDirection: 'rtl' },
                submitAttempted && validationErrors.name && styles.inputError,
              ]}
              placeholder="الاسم"
              placeholderTextColor="#999"
              value={formData.name}
              maxLength={3}
              onChangeText={(text) => {
                if (text.length > 3) {
                  showToast({ title: 'خطأ', description: 'الاسم يجب أن يكون 3 أحرف فقط', type: 'error' });
                  return;
                }
                setFormData({ ...formData, name: text });
                if (validationErrors.name) {
                  setValidationErrors(prev => ({ ...prev, name: '' }));
                }
              }}
            />
            {submitAttempted && validationErrors.name && (
              <Text style={styles.errorText}>{validationErrors.name}</Text>
            )}
            <TextInput
              style={[
                styles.input,
                { textAlign: 'right', writingDirection: 'rtl' },
                submitAttempted && validationErrors.relationship && styles.inputError,
              ]}
              placeholder="القرابة"
              placeholderTextColor="#999"
              value={formData.relationship}
              onChangeText={(text) => {
                setFormData({ ...formData, relationship: text });
                if (validationErrors.relationship) {
                  setValidationErrors(prev => ({ ...prev, relationship: '' }));
                }
              }}
            />
            {submitAttempted && validationErrors.relationship && (
              <Text style={styles.errorText}>{validationErrors.relationship}</Text>
            )}
            <View style={{ alignItems: 'center', width: '100%', marginTop: 16 }}>
              <Text style={[styles.label, { textAlign: 'center', alignSelf: 'center' }]}>الجنس</Text>
              <View style={{ flexDirection: 'row-reverse', gap: 8, justifyContent: 'center' }}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'male' && styles.genderButtonSelected,
                    submitAttempted && validationErrors.gender && styles.inputError,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'male' });
                    if (validationErrors.gender) {
                      setValidationErrors(prev => ({ ...prev, gender: '' }));
                    }
                  }}
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
                    submitAttempted && validationErrors.gender && styles.inputError,
                  ]}
                  onPress={() => {
                    setFormData({ ...formData, gender: 'female' });
                    if (validationErrors.gender) {
                      setValidationErrors(prev => ({ ...prev, gender: '' }));
                    }
                  }}
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
              {submitAttempted && validationErrors.gender && (
                <Text style={styles.errorText}>{validationErrors.gender}</Text>
              )}
            </View>
            <View style={{ alignItems: 'center', width: '100%', marginTop: 16 }}>
              <Text style={[styles.label, { textAlign: 'center', alignSelf: 'center' }]}>تاريخ الميلاد</Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  submitAttempted && validationErrors.dateOfBirth && styles.inputError,
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
                <View style={styles.datePickerModal}>
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setTempDate(selectedDate);
                      }
                    }}
                    maximumDate={new Date()}
                    minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                    style={{ alignSelf: 'flex-end', width: '100%' }}
                  />
                  <View style={styles.datePickerActions}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => {
                        if (tempDate) {
                          setFormData({ ...formData, dateOfBirth: tempDate.toISOString().split('T')[0] });
                          if (validationErrors.dateOfBirth) {
                            setValidationErrors(prev => ({ ...prev, dateOfBirth: '' }));
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
              )}
              {submitAttempted && validationErrors.dateOfBirth && (
                <Text style={styles.errorText}>{validationErrors.dateOfBirth}</Text>
              )}
            </View>
            {/* Medical Survey Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>البيانات الصحية</Text>
              {/* Height */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الطول (سم)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' },
                    submitAttempted && validationErrors.height && styles.inputError,
                  ]}
                  placeholder="مثال: 170"
                  placeholderTextColor="#999"
                  value={formData.height}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, height: text }));
                    if (validationErrors.height) {
                      setValidationErrors(prev => ({ ...prev, height: '' }));
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>
              {submitAttempted && validationErrors.height && (
                <Text style={styles.errorText}>{validationErrors.height}</Text>
              )}
              {/* Weight */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الوزن (كجم)</Text>
                <TextInput
                  style={[
                    styles.input,
                    { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' },
                    submitAttempted && validationErrors.weight && styles.inputError,
                  ]}
                  placeholder="مثال: 70"
                  placeholderTextColor="#999"
                  value={formData.weight}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, weight: text }));
                    if (validationErrors.weight) {
                      setValidationErrors(prev => ({ ...prev, weight: '' }));
                    }
                  }}
                  keyboardType="numeric"
                />
              </View>
              {submitAttempted && validationErrors.weight && (
                <Text style={styles.errorText}>{validationErrors.weight}</Text>
              )}
              {formData.height && formData.weight && calculateBMI(formData.height, formData.weight) && (
                <View style={styles.bmiBox}>
                  <Text style={[styles.bmiLabel, { textAlign: 'right', width: '100%' }]}>مؤشر كتلة الجسم (BMI):</Text>
                  <Text style={[styles.bmiValue, { textAlign: 'right', width: '100%' }]}>{calculateBMI(formData.height, formData.weight)?.toFixed(1)}</Text>
                  <Text style={[styles.bmiCategoryText, { textAlign: 'right', width: '100%' }]}>{getBMICategory(calculateBMI(formData.height, formData.weight) || 0)}</Text>
                </View>
              )}
            </View>

            <View style={styles.medicalSurveyContainer}>
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isDiabetic: !formData.isDiabetic })}
                >
                  {formData.isDiabetic && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={[styles.checkboxLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل هو/هي مصاب بالسكري؟</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isHypertensive: !formData.isHypertensive })}
                >
                  {formData.isHypertensive && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={[styles.checkboxLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل هو/هي مصاب بارتفاع ضغط الدم؟</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isCholesterol: !formData.isCholesterol })}
                >
                  {formData.isCholesterol && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={[styles.checkboxLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل هو/هي مصاب بارتفاع في الكوليسترول؟</Text>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isSmoker: !formData.isSmoker })}
                >
                  {formData.isSmoker && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={[styles.checkboxLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل هو/هي مدخن؟</Text>
              </View>

              {formData.isSmoker && (
                <View style={styles.smokingDetailsContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' },
                      submitAttempted && validationErrors.smokingAmount && styles.inputError,
                    ]}
                    placeholder="كم عدد السجائر في اليوم؟"
                    placeholderTextColor="#999"
                    value={formData.smokingDetails.amount}
                    onChangeText={(text) => {
                      setFormData({
                        ...formData,
                        smokingDetails: {
                          ...formData.smokingDetails,
                          amount: text,
                        },
                      });
                      if (validationErrors.smokingAmount) {
                        setValidationErrors(prev => ({ ...prev, smokingAmount: '' }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                  {submitAttempted && validationErrors.smokingAmount && (
                    <Text style={styles.errorText}>{validationErrors.smokingAmount}</Text>
                  )}
                  <TextInput
                    style={[
                      styles.input,
                      { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' },
                      submitAttempted && validationErrors.smokingDuration && styles.inputError,
                    ]}
                    placeholder="منذ متى يدخن؟ (بالسنوات)"
                    placeholderTextColor="#999"
                    value={formData.smokingDetails.duration}
                    onChangeText={(text) => {
                      setFormData({
                        ...formData,
                        smokingDetails: {
                          ...formData.smokingDetails,
                          duration: text,
                        },
                      });
                      if (validationErrors.smokingDuration) {
                        setValidationErrors(prev => ({ ...prev, smokingDuration: '' }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                  {submitAttempted && validationErrors.smokingDuration && (
                    <Text style={styles.errorText}>{validationErrors.smokingDuration}</Text>
                  )}
                  {formData.smokingDetails.amount && formData.smokingDetails.duration && (
                    <View style={styles.packYearsBox}>
                      <Text style={[styles.packYearsLabel, { textAlign: 'right', width: '100%' }]}>سنوات التدخين (Pack-Years):</Text>
                      <Text style={[styles.packYearsValue, { textAlign: 'right', width: '100%' }]}>{calculatePackYears(formData.smokingDetails)}</Text>
                    </View>
                  )}
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
                  <Text style={[styles.checkboxLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل هي حامل؟</Text>
                </View>
              )}

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setFormData({ ...formData, isSexuallyActive: !formData.isSexuallyActive })}
                >
                  {formData.isSexuallyActive && <MaterialIcons name="check" size={20} color="#008553" />}
                </TouchableOpacity>
                <Text style={[styles.checkboxLabel, { textAlign: 'right', alignSelf: 'flex-end' }]}>هل هو/هي نشط جنسياً؟</Text>
              </View>

              {formData.isSexuallyActive && (
                <View style={styles.partnerCountContainer}>
                  <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>عدد الشركاء</Text>
                  <View style={[styles.partnerCountButtons, { flexDirection: 'row-reverse' }]}>
                    <TouchableOpacity
                      style={[
                        styles.partnerCountButton,
                        formData.sexualActivityDetails.partnerCount === 'single' && styles.partnerCountButtonSelected,
                        submitAttempted && validationErrors.sexualActivityDetailsPartnerCount && styles.inputError,
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
                          formData.sexualActivityDetails.partnerCount === 'single' && styles.partnerCountButtonTextSelected,
                        ]}
                      >
                        شريك واحد
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.partnerCountButton,
                        formData.sexualActivityDetails.partnerCount === 'multiple' && styles.partnerCountButtonSelected,
                        submitAttempted && validationErrors.sexualActivityDetailsPartnerCount && styles.inputError,
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
                          formData.sexualActivityDetails.partnerCount === 'multiple' && styles.partnerCountButtonTextSelected,
                        ]}
                      >
                        أكثر من شريك
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center', alignSelf: 'center' }}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>{editingMember ? 'حفظ' : 'إضافة'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsModalOpen(false); setEditingMember(null); resetForm(); }}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008553',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 32,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008553',
  },
  memberDetails: {
    fontSize: 14,
    color: '#666',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#008553',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    width: '100%',
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008553',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    width: 250,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  optionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  optionButtonSelected: {
    backgroundColor: '#008553',
  },
  optionButtonText: {
    color: '#008553',
    fontWeight: 'bold',
  },
  optionButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#008553',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  genderButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  genderButtonSelected: {
    backgroundColor: '#008553',
  },
  genderButtonText: {
    color: '#008553',
    fontWeight: 'bold',
  },
  genderButtonTextSelected: {
    color: '#fff',
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
    width: '100%',
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
  inputContainer: {
    width: '100%',
  },
  bmiBox: {
    backgroundColor: '#e6faed',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  bmiLabel: {
    color: '#009966',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  bmiValue: {
    color: '#009966',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  bmiCategoryText: {
    color: '#666',
    fontSize: 16,
  },
  section: {
    marginTop: 24,
    width: '100%',
  },
  packYearsText: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  packYearsBox: {
    backgroundColor: '#fffbe6',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  packYearsLabel: {
    color: '#bfa100',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  packYearsValue: {
    color: '#bfa100',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  confirmButton: {
    backgroundColor: '#008553',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelDateButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelDateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 