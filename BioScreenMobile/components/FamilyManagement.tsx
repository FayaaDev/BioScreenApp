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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import { useToast } from '../hooks/useToast';

interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
}

const relationshipOptions = [
  { value: 'father', label: 'الوالد' },
  { value: 'mother', label: 'الوالدة' },
  { value: 'spouse', label: 'الزوج/الزوجة' },
  { value: 'child', label: 'الابن/الابنة' },
  { value: 'sibling', label: 'الأخ/الأخت' },
  { value: 'other', label: 'غيرهم' },
];

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
  });
  const [isRTL] = useState(I18nManager.isRTL);

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
    setFormData({ name: '', relationship: '', gender: '', dateOfBirth: '' });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.relationship || !formData.gender || !formData.dateOfBirth) {
      showToast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', type: 'error' });
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
                  <Text style={styles.memberDetails}>{relationshipOptions.find(r => r.value === member.relationship)?.label || member.relationship} • {member.gender === 'male' ? 'ذكر' : 'أنثى'}</Text>
                  <Text style={styles.memberDetails}>تاريخ الميلاد: {member.dateOfBirth}</Text>
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
      <TouchableOpacity style={styles.addButton} onPress={() => { setEditingMember(null); resetForm(); setIsModalOpen(true); }}>
        <Text style={styles.addButtonText}>إضافة فرد للعائلة</Text>
      </TouchableOpacity>
      {/* Modal for add/edit */}
      <Modal visible={isModalOpen} animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingMember ? 'تعديل فرد العائلة' : 'إضافة فرد للعائلة'}</Text>
            <TextInput
              style={styles.input}
              placeholder="الاسم"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            <Text style={styles.label}>القرابة</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {relationshipOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionButton, formData.relationship === option.value && styles.optionButtonSelected]}
                  onPress={() => setFormData({ ...formData, relationship: option.value })}
                >
                  <Text style={styles.optionButtonText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>الجنس</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.optionButton, formData.gender === 'male' && styles.optionButtonSelected]}
                onPress={() => setFormData({ ...formData, gender: 'male' })}
              >
                <Text style={styles.optionButtonText}>ذكر</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, formData.gender === 'female' && styles.optionButtonSelected]}
                onPress={() => setFormData({ ...formData, gender: 'female' })}
              >
                <Text style={styles.optionButtonText}>أنثى</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>تاريخ الميلاد</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>{editingMember ? 'حفظ' : 'إضافة'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { setIsModalOpen(false); setEditingMember(null); resetForm(); }}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 32,
    width: 300,
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
    alignSelf: 'flex-start',
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
}); 