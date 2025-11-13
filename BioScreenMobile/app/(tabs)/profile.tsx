import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  I18nManager,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useRouter } from 'expo-router';
import { FamilyManagement } from '../../components/FamilyManagement';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import i18n from '../../lib/i18n';
import { PhoneNumberInput, validatePhoneNumber } from '../../components/PhoneNumberInput';

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '+966',
    dateOfBirth: '',
    gender: '',
  });
  const [showAgreement, setShowAgreement] = useState(false);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('healthscreen_user_id').then((id) => {
      if (id) setUserId(id);
      else router.replace('/onboarding');
    });
  }, []);

  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['/api/users', userId],
    queryFn: () => apiRequest('GET', `/api/users/${userId}`),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData && typeof userData === 'object' && 'user' in userData) {
      const user = userData.user as { name?: string; email?: string; phoneNumber?: string; dateOfBirth: string; gender: string };
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '+966',
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      });
    }
  }, [userData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phoneNumber: string; dateOfBirth: string; gender: string }) => {
      return apiRequest('PATCH', `/api/users/${userId}`, data);
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      showToast({ title: 'تم تحديث الملف الشخصي', type: 'success' });
    },
    onError: () => {
      showToast({ title: 'خطأ', description: 'فشل في تحديث الملف الشخصي', type: 'error' });
    },
  });

  const handleSave = () => {
    // Validate phone number before saving
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) {
      showToast({ 
        title: 'خطأ في رقم الهاتف', 
        description: phoneError, 
        type: 'error' 
      });
      return;
    }
    
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (userData && typeof userData === 'object' && 'user' in userData) {
      const user = userData.user as { name?: string; email?: string; phoneNumber?: string; dateOfBirth: string; gender: string };
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '+966',
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      });
    }
    setIsEditing(false);
  };

  const handleResetProfile = async () => {
    await AsyncStorage.removeItem('healthscreen_user_id');
    showToast({ title: 'تمت إعادة تعيين الملف الشخصي', type: 'success' });
    router.replace('/onboarding');
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('healthscreen_user_id');
    showToast({ title: 'تم تسجيل الخروج', type: 'success' });
    router.replace('/login');
  };

  const handleSwitchPerson = (id: string) => {
    showToast({ title: id === 'user' ? 'تم التبديل إلى حسابك' : 'تم التبديل إلى فرد العائلة', type: 'info' });
  };

  if (!userId || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CCCE6" />
        <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
      </View>
    );
  }

  if (error) {
    AsyncStorage.removeItem('healthscreen_user_id');
    router.replace('/onboarding');
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 64 }}>
      <View style={[styles.card, isRTL && { alignItems: 'flex-end' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 16, left: 16, zIndex: 2, gap: 12 }}>
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <MaterialIcons name="edit" size={28} color="#4CCCE6" />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
            <MaterialIcons name="language" size={28} color="#4CCCE6" />
          </TouchableOpacity> */}
        </View>
        <Text style={[styles.title, isRTL && { textAlign: 'right', alignSelf: 'flex-end' }]}>الملف الشخصي</Text>
        <View style={[styles.form, isRTL && { alignItems: 'flex-end' }]}>
          <View style={[styles.inputContainer, isRTL && { alignItems: 'flex-end', width: '100%' }]}>
            <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الاسم الكامل</Text>
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={isEditing}
            />
          </View>
          <View style={[styles.inputContainer, isRTL && { alignItems: 'flex-end', width: '100%' }]}>
            <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>البريد الإلكتروني</Text>
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl', alignSelf: 'flex-end' }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <PhoneNumberInput
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            editable={isEditing}
            required={true}
          />
          
          <View style={[styles.inputContainer, isRTL && { alignItems: 'flex-end', width: '100%' }]}>
            <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>تاريخ الميلاد</Text>
            {isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setTempDate(formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date());
                    setShowDatePicker(true);
                  }}
                  style={styles.datePickerButton}
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
                      display={Platform.OS === 'ios' ? 'default' : 'calendar'}
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
              </>
            ) : (
              <Text style={styles.profileValueText}>
                {formData.dateOfBirth
                  ? new Date(formData.dateOfBirth).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : '-'}
              </Text>
            )}
          </View>
          <View style={[styles.inputContainer, isRTL && { alignItems: 'flex-end', width: '100%' }]}>
            <Text style={[styles.label, { textAlign: 'right', alignSelf: 'flex-end' }]}>الجنس</Text>
            {isEditing || true ? (
              <View style={[styles.genderContainer, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    formData.gender === 'male' && styles.genderButtonSelected,
                  ]}
                  disabled={!isEditing}
                  onPress={() => isEditing && setFormData({ ...formData, gender: 'male' })}
                >
                  <MaterialIcons
                    name="male"
                    size={20}
                    color={formData.gender === 'male' ? '#fff' : '#4CCCE6'}
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
                  disabled={!isEditing}
                  onPress={() => isEditing && setFormData({ ...formData, gender: 'female' })}
                >
                  <MaterialIcons
                    name="female"
                    size={20}
                    color={formData.gender === 'female' ? '#fff' : '#4CCCE6'}
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
            ) : null}
          </View>
        </View>
        {isEditing ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={updateProfileMutation.isPending}>
              <Text style={styles.saveButtonText}>حفظ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Family Management Section */}
      <View style={[styles.card, isRTL && { alignItems: 'flex-end' }]}>
        <FamilyManagement userId={userId!} onSwitchPerson={handleSwitchPerson} />
      </View>

      {/* Reset Profile and Sign Out */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.agreementButton} onPress={() => setShowAgreement(true)}>
          <Text style={styles.agreementButtonText}>اتفاقية المستخدم</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal visible={showLanguageModal} animationType="slide" transparent onRequestClose={() => setShowLanguageModal(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#2E3130', borderRadius: 16, padding: 24, minWidth: 280 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4CCCE6', marginBottom: 16, textAlign: 'center' }}>تغيير اللغة</Text>
            <TouchableOpacity
              style={{ backgroundColor: i18n.language === 'ar' ? '#4CCCE6' : '#202221', borderRadius: 8, paddingVertical: 12, marginBottom: 12, alignItems: 'center' }}
              onPress={() => { i18n.changeLanguage('ar'); setShowLanguageModal(false); }}
            >
              <Text style={{ color: i18n.language === 'ar' ? '#fff' : '#4CCCE6', fontWeight: 'bold', fontSize: 16 }}>العربية</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: i18n.language === 'en' ? '#4CCCE6' : '#202221', borderRadius: 8, paddingVertical: 12, marginBottom: 4, alignItems: 'center' }}
              onPress={() => { i18n.changeLanguage('en'); setShowLanguageModal(false); }}
            >
              <Text style={{ color: i18n.language === 'en' ? '#fff' : '#4CCCE6', fontWeight: 'bold', fontSize: 16 }}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 8, alignItems: 'center' }} onPress={() => setShowLanguageModal(false)}>
              <Text style={{ color: '#4CCCE6', fontWeight: 'bold', fontSize: 16 }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Agreement Modal */}
      <Modal visible={showAgreement} animationType="slide" onRequestClose={() => setShowAgreement(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={[styles.modalContent, { paddingTop: 60 }]}>
            <Text style={styles.modalTitle}>اتفاقية المستخدم لتطبيق الفحص الطبي</Text>
            <Text style={styles.modalText}>
تهدف هذه الاتفاقية إلى تحديد شروط وأحكام استخدامك لتطبيق الفحص الطبي ("بكّر")، والذي تم تطويره بواسطة الدكتور/ أحمد ال فائع.

باستخدامك للتطبيق، فإنك توافق على الالتزام بجميع الشروط التالية:

بكّر هو أداة لتسهيل حجز مواعيد الفحص الطبي وليس بديلاً عن الاستشارة الطبية المهنية. 

جميع التوصيات والإرشادات في التطبيق مستندة إلى الدليل السعودي للإجراءات الوقائية السريرية (الإصدار النهائي 2023) الصادر عن الهيئة السعودية للصحة العامة.

يقر المستخدم بأن الدكتور/ أحمد ال فائع لا يتحمل أي مسؤولية عن أية أضرار أو خسائر تنجم عن استخدام التطبيق، بما في ذلك الأخطاء أو الأعطال أو القرارات المبنية على المعلومات المقدمة. 

جميع حقوق الملكية الفكرية محفوظة للدكتور/ أحمد ال فائع، ويمنع نسخ أو تعديل أو استخدام التطبيق لأغراض تجارية دون إذن خطي. 

يلتزم المستخدم باستخدام التطبيق لأغراض مشروعة فقط، ويُمنع أي استخدام يضر بالتطبيق أو يخل بحقوق الآخرين.

يحق للدكتور/ أحمد ال فائع إنهاء استخدام التطبيق في حال مخالفة الشروط دون إشعار مسبق. 

تخضع هذه الاتفاقية لقوانين المملكة العربية السعودية. يجوز تعديل الشروط في أي وقت، ويُعتبر استمرار الاستخدام موافقة على التعديلات. للاستفسارات، 

باستخدامك للتطبيق، فإنك تقر بأنك قرأت ووافقت على هذه الاتفاقية.
            </Text>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowAgreement(false)}>
              <Text style={styles.closeModalButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202221',
    padding: 16,
    paddingTop: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202221',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4CCCE6',
  },
  card: {
    backgroundColor: '#2E3130',
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CCCE6',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CCCE6',
    marginBottom: 12,
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
    color: '#374151',
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#2E3130',
    color: '#ECEDEE',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CCCE6',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  langButton: {
    backgroundColor: '#202221',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
  },
  resetButton: {
    backgroundColor: '#fbbf24',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  agreementButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  agreementButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#202221',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CCCE6',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#ECEDEE',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 24,
    writingDirection: 'rtl',
    paddingHorizontal: 16,
  },
  closeModalButton: {
    backgroundColor: '#4CCCE6',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ECEDEE',
  },
  languageValue: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 12,
  },
  genderButton: {
    backgroundColor: '#202221',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 0,
  },
  genderButtonSelected: {
    backgroundColor: '#4CCCE6',
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ECEDEE',
    marginTop: 4,
  },
  genderButtonTextSelected: {
    color: '#fff',
  },
  profileValueText: {
    fontSize: 16,
    color: '#ECEDEE',
    textAlign: 'right',
    marginVertical: 4,
    alignSelf: 'flex-end',
  },
  datePickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#202221',
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 4,
    width: '100%',
  },
  datePickerModal: {
    backgroundColor: '#2E3130',
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
    backgroundColor: '#4CCCE6',
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