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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { useRouter } from 'expo-router';
import { FamilyManagement } from '../../components/FamilyManagement';

// Placeholder for LanguageSwitcher
const LanguageSwitcher = () => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <TouchableOpacity style={styles.langButton}><Text>العربية</Text></TouchableOpacity>
    <TouchableOpacity style={styles.langButton}><Text>English</Text></TouchableOpacity>
  </View>
);

export default function Profile() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dateOfBirth: '',
    gender: '',
  });
  const [showAgreement, setShowAgreement] = useState(false);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

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
      const user = userData.user as { name?: string; email?: string; dateOfBirth: string; gender: string };
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      });
    }
  }, [userData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; dateOfBirth: string; gender: string }) => {
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
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (userData && typeof userData === 'object' && 'user' in userData) {
      const user = userData.user as { name?: string; email?: string; dateOfBirth: string; gender: string };
      setFormData({
        name: user.name || '',
        email: user.email || '',
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
        <ActivityIndicator size="large" color="#008553" />
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.card}>
        <Text style={styles.title}>الملف الشخصي</Text>
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>الاسم الكامل</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              editable={isEditing}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>تاريخ الميلاد</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              editable={isEditing}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>الجنس</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              value={formData.gender}
              onChangeText={(text) => setFormData({ ...formData, gender: text })}
              editable={isEditing}
              placeholder="ذكر / أنثى"
            />
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
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>تعديل</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Language Switcher */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>إعدادات اللغة</Text>
        <LanguageSwitcher />
      </View>

      {/* Family Management Section */}
      <FamilyManagement userId={userId!} onSwitchPerson={handleSwitchPerson} />

      {/* Reset Profile and Sign Out */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetProfile}>
          <Text style={styles.resetButtonText}>إعادة تعيين الملف الشخصي</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.agreementButton} onPress={() => setShowAgreement(true)}>
          <Text style={styles.agreementButtonText}>اتفاقية المستخدم</Text>
        </TouchableOpacity>
      </View>

      {/* User Agreement Modal */}
      <Modal visible={showAgreement} animationType="slide" onRequestClose={() => setShowAgreement(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>اتفاقية المستخدم لتطبيق الفحص الطبي</Text>
            <Text style={styles.modalText}>هنا يمكنك وضع نص اتفاقية المستخدم...</Text>
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
    backgroundColor: '#f8fffe',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#008553',
  },
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#008553',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008553',
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
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#008553',
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
  editButton: {
    marginTop: 16,
    backgroundColor: '#008553',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  langButton: {
    backgroundColor: '#f0f0f0',
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
    backgroundColor: '#fff',
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
    color: '#008553',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  closeModalButton: {
    backgroundColor: '#008553',
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
}); 