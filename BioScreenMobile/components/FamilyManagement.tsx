import { useEffect, useState } from "react";
import {
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
} from "react-native";
import { View, Text, Card, Button, TouchableOpacity, Checkbox, TextField, Modal, Slider, Chip, Colors } from 'react-native-ui-lib';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/useToast";
import { medicalStorage } from "../lib/medical-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface FamilyMember {
  id: string;
  userId: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
  // Medical survey fields
  medicalConditions?: string[];
  smokingDetails?: {
    amount: string;
    duration: string;
  };
  height: string;
  weight: string;
  isPregnant?: boolean;
  isSexuallyActive: boolean;
  sexualActivityDetails?: {
    partnerCount: "single" | "multiple";
  };
  // Legacy fields for backward compatibility
  isDiabetic?: boolean;
  isHypertensive?: boolean;
  isCholesterol?: boolean;
  isSmoker?: boolean;
}

export function FamilyManagement({
  userId,
  onSwitchPerson,
}: {
  userId: string;
  onSwitchPerson?: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();

  const styles = {
    card: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    title: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.primary,
      marginBottom: 12,
      textAlign: "center",
      fontFamily: "ReadexPro-Bold",
    },
    emptyText: {
      textAlign: "center",
      color: Colors.textSecondary,
      fontSize: 16,
      marginTop: 32,
      fontFamily: "ReadexPro",
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.background,
      borderRadius: 16,
      padding: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: Colors.textSecondary + '20',
      marginBottom: 8,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.primary,
      fontFamily: "ReadexPro-Bold",
    },
    memberDetails: {
      fontSize: 14,
      color: Colors.textSecondary,
      fontFamily: "ReadexPro",
    },
    memberActions: {
      flexDirection: "row",
      gap: 8,
    },
    editButton: {
      backgroundColor: Colors.primary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    editButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontFamily: "ReadexPro-Bold",
    },
    deleteButton: {
      backgroundColor: Colors.textSecondary,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginLeft: 4,
    },
    deleteButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontFamily: "ReadexPro-Bold",
    },
    addButton: {
      backgroundColor: Colors.primary,
      borderRadius: 8,
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 16,
    },
    addButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontSize: 16,
      fontFamily: "ReadexPro-Bold",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: Colors.background,
      paddingTop: 32,
    },
    modalContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: Colors.primary,
      marginBottom: 12,
      textAlign: "center",
      fontFamily: "ReadexPro-Bold",
    },
    input: {
      height: 48,
      borderWidth: 1,
      borderColor: Colors.textSecondary,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
      backgroundColor: Colors.card,
      color: Colors.text,
      // width: "100%",
      width: 250,
      marginBottom: 8,
      fontFamily: "ReadexPro",
    },
    label: {
      fontSize: 16,
      color: Colors.text,
      fontWeight: "500",
      marginBottom: 4,
      alignSelf: "flex-start",
      textAlign: "left",
      fontFamily: "ReadexPro-Medium",
    },
    optionButton: {
      backgroundColor: Colors.card,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 4,
      marginBottom: 4,
    },
    optionButtonSelected: {
      backgroundColor: Colors.primary,
    },
    optionButtonText: {
      color: Colors.primary,
      fontWeight: "bold",
      fontFamily: "ReadexPro-Bold",
    },
    optionButtonTextSelected: {
      color: Colors.white,
      fontWeight: "bold",
      fontFamily: "ReadexPro-Bold",
    },
    saveButton: {
      backgroundColor: Colors.primary,
      borderRadius: 8,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    saveButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontSize: 16,
      fontFamily: "ReadexPro-Bold",
    },
    cancelButton: {
      backgroundColor: Colors.error,
      borderRadius: 8,
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    cancelButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontSize: 16,
      fontFamily: "ReadexPro-Bold",
    },
    genderButton: {
      backgroundColor: Colors.background,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginHorizontal: 4,
      marginBottom: 4,
    },
    genderButtonSelected: {
      backgroundColor: Colors.primary,
    },
    genderButtonText: {
      color: Colors.primary,
      fontWeight: "bold",
      fontFamily: "ReadexPro-Bold",
    },
    genderButtonTextSelected: {
      color: Colors.white,
      fontFamily: "ReadexPro-Bold",
    },
    questionContainer: {
      gap: 8,
      width: "100%",
    },
    questionLabel: {
      fontSize: 16,
      color: Colors.text,
      fontWeight: "500",
      marginBottom: 4,
      fontFamily: "ReadexPro-Medium",
    },
    yesNoContainer: {
      flexDirection: "row",
      gap: 12,
    },
    yesNoButton: {
      flex: 1,
      height: 48,
      borderWidth: 1,
      borderColor: Colors.primary,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.card,
    },
    yesNoButtonSelected: {
      backgroundColor: Colors.primary,
    },
    yesNoButtonText: {
      fontSize: 16,
      color: Colors.primary,
      fontFamily: "ReadexPro-Bold",
    },
    yesNoButtonTextSelected: {
      color: Colors.white,
      fontFamily: "ReadexPro-Bold",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.primary,
      textAlign: "center",
      alignSelf: "center",
      fontFamily: "ReadexPro-Bold",
    },
    medicalSurveyContainer: {
      gap: 16,
      width: "100%",
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 2,
      borderColor: Colors.primary,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxLabel: {
      fontSize: 16,
      color: Colors.text,
      fontFamily: "ReadexPro",
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
      flexDirection: "row",
      gap: 8,
    },
    partnerCountButton: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: Colors.primary,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.card,
    },
    partnerCountButtonSelected: {
      backgroundColor: Colors.primary,
    },
    partnerCountButtonText: {
      fontSize: 14,
      color: Colors.primary,
      fontFamily: "ReadexPro-Bold",
    },
    partnerCountButtonTextSelected: {
      color: Colors.white,
      fontFamily: "ReadexPro-Bold",
    },
    inputContainer: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    bmiBox: {
      backgroundColor: Colors.background,
      borderRadius: 10,
      padding: 16,
      marginTop: 12,
      alignItems: "flex-start",
    },
    bmiLabel: {
      color: Colors.success,
      fontWeight: "bold",
      fontSize: 16,
      marginBottom: 4,
      fontFamily: "ReadexPro-Bold",
    },
    bmiValue: {
      color: Colors.success,
      fontWeight: "bold",
      fontSize: 28,
      marginBottom: 4,
      fontFamily: "ReadexPro-Bold",
    },
    bmiCategoryText: {
      color: Colors.textSecondary,
      fontSize: 16,
      fontFamily: "ReadexPro",
    },
    section: {
      marginTop: 24,
      width: "100%",
    },
    packYearsText: {
      color: Colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
      fontFamily: "ReadexPro",
    },
    packYearsBox: {
      backgroundColor: Colors.background,
      borderRadius: 10,
      padding: 16,
      marginTop: 12,
      alignItems: "flex-start",
    },
    packYearsLabel: {
      color: Colors.warning,
      fontWeight: "bold",
      fontSize: 16,
      marginBottom: 4,
      fontFamily: "ReadexPro-Bold",
    },
    packYearsValue: {
      color: Colors.warning,
      fontWeight: "bold",
      fontSize: 28,
      marginBottom: 4,
      fontFamily: "ReadexPro-Bold",
    },
    inputError: {
      borderColor: Colors.error,
      borderWidth: 1,
    },
    errorText: {
      color: Colors.error,
      fontSize: 12,
      marginTop: -4,
      marginBottom: 8,
      textAlign: "left",
      alignSelf: "flex-start",
      fontFamily: "ReadexPro",
    },
    warningText: {
      color: Colors.warning,
      fontSize: 12,
      marginTop: -4,
      marginBottom: 8,
      fontWeight: "500",
      fontFamily: "ReadexPro-Medium",
    },
    datePickerButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: Colors.background,
      alignSelf: "flex-end",
      marginTop: 4,
      marginBottom: 4,
      width: "100%",
    },
    datePickerModal: {
      backgroundColor: Colors.card,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      width: "100%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    datePickerActions: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginTop: 16,
    },
    confirmButton: {
      backgroundColor: Colors.primary,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 24,
    },
    confirmButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontSize: 16,
      fontFamily: "ReadexPro-Bold",
    },
    cancelDateButton: {
      backgroundColor: Colors.error,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 24,
    },
    cancelDateButtonText: {
      color: Colors.white,
      fontWeight: "bold",
      fontSize: 16,
      fontFamily: "ReadexPro-Bold",
    },
  };

  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    relationship: "",
    gender: "",
    dateOfBirth: "",
    // Medical survey fields
    medicalConditions: [] as string[],
    smokingDetails: {
      amount: "",
      duration: "",
    },
    height: "",
    weight: "",
    isPregnant: false,
    isSexuallyActive: false,
    sexualActivityDetails: {
      partnerCount: "single" as "single" | "multiple",
    },
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [selectedInfoCondition, setSelectedInfoCondition] = useState<string | null>(null);

  const conditionExplanations: { [key: string]: string } = {
    'قلة النشاط البدني': 'أمارس أقل من ساعتين ونصف أسبوعيًا من النشاط البدني المعتدل، مثل المشي السريع',
    'تدخين التبغ': 'أستخدم منتجات التبغ، مثل السجائر أو الشيشة',
    'مرض ارتفاع ضغط الدم': 'لدي مرض ارتفاع ضغط الدم',
    'داء السكري': 'لدي مرض السكري من النوع الأول أو الثاني، المعروف أيضًا بداء السكري',
    'تاريخ لمرض قلبي وعائي': 'أصبت بأحد الأمراض القلبية الوعائية، مثل النوبة القلبية أو الذبحة الصدرية أو السكتة الدماغية',
    'مرض عضوي مزمن': 'لدي مرض مزمن في القلب أو الرئتين أو الكبد أو الكلى',
    'قراءات مرتفعة لضغط الدم': 'قراءاتي لضغط الدم أعلى من 130‏/85 ملم زئبق، دون تشخيص بمرض ارتفاع ضغط الدم',
    'تاريخ عائلي للسكري': 'لدى أحد أفراد عائلتي (الوالدين أو الإخوة) مرض السكري',
    'تاريخ لسكري الحمل': 'أصبت بمرض سكري الحمل في حمل سابق',
    'تاريخ جنسي': 'قمت باتصال جنسي خلال علاقة زوجية حالية أو سابقة',
  };

  const { data: familyMembers, isLoading } = useQuery<FamilyMember[]>({
    queryKey: ["family", userId],
    queryFn: async () => {
      if (!userId) return [];
      return await medicalStorage.getFamilyMembers(userId);
    },
    enabled: !!userId,
  });

  const createFamilyMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const newMember = {
        ...data,
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString(),
      };
      await medicalStorage.saveFamilyMember(userId, newMember as any);
      return newMember as FamilyMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["family", userId],
      });
      setIsModalOpen(false);
      setEditingMember(null);
      resetForm();
      showToast({ title: t("family.memberAdded"), type: "success" });
    },
    onError: () => {
      showToast({
        title: t("common.error"),
        description: t("family.addError"),
        type: "error",
      });
    },
  });

  const updateFamilyMemberMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<typeof formData>;
    }) => {
      const members = await medicalStorage.getFamilyMembers(userId);
      const memberIndex = members.findIndex(m => m.id === id);
      if (memberIndex !== -1) {
        members[memberIndex] = { ...members[memberIndex], ...data };
        await AsyncStorage.setItem(`family_members_${userId}`, JSON.stringify(members));
      }
      return members[memberIndex];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["family", userId],
      });
      setEditingMember(null);
      setIsModalOpen(false);
      resetForm();
      showToast({ title: t("family.memberUpdated"), type: "success" });
    },
    onError: () => {
      showToast({
        title: t("common.error"),
        description: t("family.updateError"),
        type: "error",
      });
    },
  });

  const deleteFamilyMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const members = await medicalStorage.getFamilyMembers(userId);
      const filteredMembers = members.filter(m => m.id !== id);
      await AsyncStorage.setItem(`family_members_${userId}`, JSON.stringify(filteredMembers));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["family", userId],
      });
      showToast({ title: t("family.memberDeleted"), type: "success" });
    },
    onError: () => {
      showToast({
        title: t("common.error"),
        description: t("family.deleteError"),
        type: "error",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      relationship: "",
      gender: "",
      dateOfBirth: "",
      medicalConditions: [],
      smokingDetails: {
        amount: "",
        duration: "",
      },
      height: "",
      weight: "",
      isPregnant: false,
      isSexuallyActive: false,
      sexualActivityDetails: {
        partnerCount: "single",
      },
    });
    setSubmitAttempted(false);
    setValidationErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.relationship.trim()) {
      newErrors.relationship = t("family.validation.relationshipRequired");
    }

    if (!formData.gender) {
      newErrors.gender = t("family.validation.genderRequired");
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t("family.validation.dateOfBirthRequired");
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120); // Maximum age of 120 years

      if (isNaN(birthDate.getTime())) {
        newErrors.dateOfBirth = t("family.validation.dateOfBirthInvalid");
      } else if (birthDate > today) {
        newErrors.dateOfBirth = t("family.validation.dateOfBirthFuture");
      } else if (birthDate < minDate) {
        newErrors.dateOfBirth = t("family.validation.dateOfBirthUnrealistic");
      }
    }

    if (!formData.height.trim()) {
      newErrors.height = t("family.validation.heightRequired");
    } else if (
      isNaN(parseFloat(formData.height)) ||
      parseFloat(formData.height) <= 0
    ) {
      newErrors.height = t("family.validation.heightInvalid");
    }

    if (!formData.weight.trim()) {
      newErrors.weight = t("family.validation.weightRequired");
    } else if (
      isNaN(parseFloat(formData.weight)) ||
      parseFloat(formData.weight) <= 0
    ) {
      newErrors.weight = t("family.validation.weightInvalid");
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    console.log("Form data:", formData);
    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    console.log("Validation errors:", validationErrors);
    if (!isValid) {
      console.log("Form validation failed, not submitting");
      return;
    }
    console.log("Submitting form...");
    if (editingMember) {
      console.log("Updating member:", editingMember.id);
      updateFamilyMemberMutation.mutate({
        id: editingMember.id,
        data: formData,
      });
    } else {
      console.log("Creating new member");
      createFamilyMemberMutation.mutate(formData);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);

    // Convert legacy fields to medical conditions array
    const conditions: string[] = member.medicalConditions || [];
    if (member.isDiabetic && !conditions.includes('داء السكري')) {
      conditions.push('داء السكري');
    }
    if (member.isHypertensive && !conditions.includes('مرض ارتفاع ضغط الدم')) {
      conditions.push('مرض ارتفاع ضغط الدم');
    }
    if (member.isCholesterol && !conditions.includes('قراءات مرتفعة لضغط الدم')) {
      conditions.push('قراءات مرتفعة لضغط الدم');
    }
    if (member.isSmoker && !conditions.includes('تدخين التبغ')) {
      conditions.push('تدخين التبغ');
    }

    setFormData({
      relationship: member.relationship,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      medicalConditions: conditions,
      smokingDetails: member.smokingDetails ?? { amount: "", duration: "" },
      height: member.height ?? "",
      weight: member.weight ?? "",
      isPregnant: member.isPregnant ?? false,
      isSexuallyActive: member.isSexuallyActive ?? false,
      sexualActivityDetails: member.sexualActivityDetails ?? {
        partnerCount: "single",
      },
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("family.confirmDelete"), t("family.confirmDeleteDesc"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("family.delete"),
        style: "destructive",
        onPress: () => deleteFamilyMemberMutation.mutate(id),
      },
    ]);
  };

  const handleSwitch = async (id: string) => {
    await AsyncStorage.setItem("selectedPersonId", id);
    if (onSwitchPerson) onSwitchPerson(id);
    showToast({ title: t("family.memberUpdated"), type: "info" });
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
    if (bmi < 18.4) return t("family.bmiCategory.underweight");
    if (18.5 <= bmi && bmi < 24.9) return t("family.bmiCategory.normal");
    if (25 <= bmi && bmi < 29.9) return t("family.bmiCategory.overweight");
    if (30 <= bmi && bmi < 34.9) return t("family.bmiCategory.obese1");
    if (35 <= bmi && bmi < 39.9) return t("family.bmiCategory.obese2");
    if (bmi > 40) return t("family.bmiCategory.obese3");
    return t("family.bmiCategory.tryAgain");
  };

  const renderConditionChip = (condition: string) => {
    const isSelected = formData.medicalConditions.includes(condition);

    return (
      <View key={condition} style={{ position: 'relative' }}>
        <Chip
          label={condition}
          onPress={() => {
            console.log('Chip pressed:', condition);
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
            color: isSelected ? '#fff' : Colors.textSecondary,
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
          onPressIn={() => console.log('Info button PRESS IN:', condition)}
          onPressOut={() => console.log('Info button PRESS OUT:', condition)}
          onPress={() => {
            console.log('Info button PRESSED!!!:', condition);
            setSelectedInfoCondition(condition);
          }}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: [{ translateY: -12 }],
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: isSelected ? Colors.white + '33' : Colors.primary + '33', // 20% opacity
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
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

  return (
    <>
      <Text text70 center style={{ fontFamily: 'ReadexPro-Bold', marginBottom: 12, color: Colors.text }}>{t("family.title")}</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <ScrollView
          style={{ maxHeight: 300 }}
          contentContainerStyle={{ gap: 12 }}
        >
          {!familyMembers || !Array.isArray(familyMembers) || familyMembers.length === 0 ? (
            <Text center textSecondary text70 style={{ fontFamily: 'ReadexPro', marginTop: 32 }}>{t("family.noMembers")}</Text>
          ) : (
            familyMembers.map((member: FamilyMember) => (
              <View key={member.id} style={styles.memberRow as any}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: member.gender === 'male' ? Colors.primary + '20' : Colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: isRTL ? 0 : 12,
                  marginLeft: isRTL ? 12 : 0,
                }}>
                  <MaterialIcons
                    name={member.gender === 'male' ? "male" : "female"}
                    size={28}
                    color={Colors.primary}
                  />
                </View>

                <TouchableOpacity
                  style={styles.memberInfo}
                  onPress={() => handleSwitch(member.id)}
                >
                  <Text style={styles.memberName as any}>{member.relationship}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Text style={styles.memberDetails}>
                      {member.gender === "male" ? t("common.male") : t("common.female")}
                    </Text>
                    <Text style={styles.memberDetails}>•</Text>
                    <Text style={styles.memberDetails}>
                      {member.dateOfBirth}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.memberActions as any}>
                  <TouchableOpacity
                    style={{
                      padding: 8,
                      backgroundColor: Colors.card,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: Colors.primary + '40',
                    }}
                    onPress={() => handleEdit(member)}
                  >
                    <MaterialIcons name="edit" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      padding: 8,
                      backgroundColor: Colors.error + '10',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: Colors.error + '40',
                    }}
                    onPress={() => handleDelete(member.id)}
                  >
                    <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <Button
        label={t("family.addMember")}
        backgroundColor={Colors.primary}
        marginT-s4
        paddingV-s5
        borderRadius={200}
        style={{ opacity: Array.isArray(familyMembers) && familyMembers.length >= 5 ? 0.5 : 1 }}
        disabled={Array.isArray(familyMembers) && familyMembers.length >= 5}
        onPress={() => {
          if (Array.isArray(familyMembers) && familyMembers.length >= 5) {
            showToast({
              title: t("family.maxLimitReached"),
              description: t("family.maxFamilyMembers"),
              type: "error",
            });
            return;
          }
          setEditingMember(null);
          resetForm();
          setIsModalOpen(true);
        }}
        labelStyle={{ fontFamily: 'ReadexPro-Bold', fontSize: 16 }}
      />
      {Array.isArray(familyMembers) && familyMembers.length >= 5 && (
        <Text
          style={{
            color: Colors.error,
            marginTop: 8,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {t("family.cannotAddMore")}
        </Text>
      )}
      {/* Modal for add/edit */}
      <Modal
        visible={isModalOpen}
        onDismiss={() => setIsModalOpen(false)}
        overlayBackgroundColor={Colors.overlay}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={[
            styles.modalContainer, {
              paddingTop: insets.top
            }
          ]
          }>
            <ScrollView
              contentContainerStyle={styles.modalContent as any}
              showsVerticalScrollIndicator={false}
            >
              <Card padding-s5 backgroundColor={Colors.card} br40 style={{ width: '100%' }}>
                <View center marginB-s4>
                  <Text h3 zimam-primary center marginB-s2>
                    {editingMember ? t("family.editMember") : t("family.addMember")}
                  </Text>
                  <Text body textSecondary center>
                    {t("family.addMemberDescription")}
                  </Text>
                </View>

                <View>
                  {/* Relationship Field */}
                  <View marginB-s4>
                    <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>العلاقة</Text>
                    <TextField
                      style={{
                        height: 48,
                        borderWidth: 1,
                        borderColor: validationErrors.relationship ? Colors.error : Colors.textSecondary,
                        borderRadius: 8,
                        backgroundColor: Colors.card,
                        paddingHorizontal: 16,
                        fontSize: 16,
                        color: Colors.text,
                        fontFamily: 'ReadexPro',
                        textAlign: 'right',
                      }}
                      placeholder={t("family.relationship")}
                      placeholderTextColor={Colors.textSecondary}
                      value={formData.relationship}
                      onChangeText={(text) => {
                        setFormData({ ...formData, relationship: text });
                        if (validationErrors.relationship) {
                          setValidationErrors({ ...validationErrors, relationship: '' });
                        }
                      }}
                    />
                    {submitAttempted && validationErrors.relationship && (
                      <Text error caption marginT-s1>{validationErrors.relationship}</Text>
                    )}
                  </View>

                  {/* Gender */}
                  <View marginB-s4>
                    <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>الجنس</Text>
                    <View row spread style={{ gap: 12, flexDirection: 'row-reverse' }}>
                      <ArabicButton
                        label={t("common.male")}
                        isSelected={formData.gender === 'male'}
                        onPress={() => {
                          setFormData({ ...formData, gender: 'male' });
                          if (validationErrors.gender) {
                            setValidationErrors({ ...validationErrors, gender: '' });
                          }
                        }}
                        icon={
                          <MaterialIcons
                            name="male"
                            size={20}
                            color={formData.gender === 'male' ? Colors.white : Colors.textSecondary}
                          />
                        }
                      />
                      <ArabicButton
                        label={t("common.female")}
                        isSelected={formData.gender === 'female'}
                        onPress={() => {
                          setFormData({ ...formData, gender: 'female' });
                          if (validationErrors.gender) {
                            setValidationErrors({ ...validationErrors, gender: '' });
                          }
                        }}
                        icon={
                          <MaterialIcons
                            name="female"
                            size={20}
                            color={formData.gender === 'female' ? Colors.white : Colors.textSecondary}
                          />
                        }
                      />
                    </View>
                    {submitAttempted && validationErrors.gender && (
                      <Text error caption marginT-s1>{validationErrors.gender}</Text>
                    )}
                  </View>

                  {/* Date of Birth */}
                  <View marginB-s4>
                    <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>تاريخ الميلاد</Text>
                    <TouchableOpacity
                      style={{
                        height: 48,
                        borderWidth: 1,
                        borderColor: validationErrors.dateOfBirth ? Colors.error : Colors.textSecondary,
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
                          : 'اختر تاريخ الميلاد'}
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
                              onChange={(event, selectedDate) => {
                                setTempDate(selectedDate || tempDate);
                              }}
                              maximumDate={new Date()}
                              minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                              style={{ width: '100%' }}
                              textColor={Colors.text}
                              themeVariant="dark"
                            />
                            <View row spread marginT-s4 style={{ width: '100%', gap: 12 }}>
                              <Button
                                label="إلغاء"
                                backgroundColor={Colors.background}
                                style={{ flex: 1, paddingVertical: 12 }}
                                onPress={() => {
                                  setShowDatePicker(false);
                                  setTempDate(null);
                                }}
                                labelStyle={{ color: Colors.primary, fontFamily: 'ReadexPro-SemiBold', fontSize: 16 }}
                              />
                              <Button
                                label="تأكيد"
                                backgroundColor={Colors.primary}
                                style={{ flex: 1, paddingVertical: 12 }}
                                onPress={() => {
                                  if (tempDate) {
                                    setFormData({
                                      ...formData,
                                      dateOfBirth: tempDate.toISOString().split('T')[0],
                                    });
                                    if (validationErrors.dateOfBirth) {
                                      setValidationErrors({ ...validationErrors, dateOfBirth: '' });
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
                            if (validationErrors.dateOfBirth) {
                              setValidationErrors({ ...validationErrors, dateOfBirth: '' });
                            }
                          }
                        }}
                        maximumDate={new Date()}
                        minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                        themeVariant="dark"
                        positiveButton={{ label: 'موافق', textColor: Colors.primary }}
                        negativeButton={{ label: 'إلغاء', textColor: Colors.error }}
                      />
                    )}
                    {submitAttempted && validationErrors.dateOfBirth && (
                      <Text error caption marginT-s1>{validationErrors.dateOfBirth}</Text>
                    )}
                  </View>

                  {/* Height */}
                  <View marginB-s4>
                    <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>
                      الطول: {formData.height || '140'} سم
                    </Text>
                    <Slider
                      value={parseFloat(formData.height) || 140}
                      minimumValue={100}
                      maximumValue={250}
                      step={1}
                      onValueChange={(value) => {
                        setFormData({ ...formData, height: value.toString() });
                        if (validationErrors.height) {
                          setValidationErrors({ ...validationErrors, height: '' });
                        }
                      }}
                      thumbTintColor={formData.height ? Colors.primary : Colors.textSecondary}
                      minimumTrackTintColor={formData.height ? Colors.primary : Colors.textSecondary}
                      maximumTrackTintColor={Colors.textSecondary}
                      containerStyle={{ marginBottom: 8 }}
                    />
                    {validationErrors.height && <Text error caption marginT-s1>{validationErrors.height}</Text>}
                  </View>

                  {/* Weight */}
                  <View marginB-s4>
                    <Text bodySmall right marginB-s2 style={{ color: Colors.text }}>
                      {t("family.weight")}: {formData.weight || '60'} كجم
                    </Text>
                    <Slider
                      value={parseFloat(formData.weight) || 60}
                      minimumValue={30}
                      maximumValue={200}
                      step={1}
                      onValueChange={(value) => {
                        setFormData({ ...formData, weight: value.toString() });
                        if (validationErrors.weight) {
                          setValidationErrors({ ...validationErrors, weight: '' });
                        }
                      }}
                      thumbTintColor={formData.weight ? Colors.primary : Colors.textSecondary}
                      minimumTrackTintColor={formData.weight ? Colors.primary : Colors.textSecondary}
                      maximumTrackTintColor={Colors.textSecondary}
                      containerStyle={{ marginBottom: 8 }}
                    />
                    {validationErrors.weight && <Text error caption marginT-s1>{validationErrors.weight}</Text>}
                  </View>

                  {formData.height &&
                    formData.weight &&
                    calculateBMI(formData.height, formData.weight) && (
                      <View style={{
                        backgroundColor: Colors.card,
                        borderRadius: 16,
                        padding: 16,
                        marginTop: 12,
                        alignItems: 'center',
                      }}>
                        <Text style={{ color: Colors.primary, fontFamily: 'ReadexPro-Bold', fontSize: 16, marginBottom: 8 }}>
                          {t("family.bmi")}
                        </Text>
                        <Text style={{ color: Colors.primary, fontFamily: 'ReadexPro-Bold', fontSize: 32, marginBottom: 4 }}>
                          {calculateBMI(formData.height, formData.weight)?.toFixed(1)}
                        </Text>
                        <Text style={{ color: Colors.text, fontSize: 14, fontFamily: 'ReadexPro' }}>
                          {getBMICategory(calculateBMI(formData.height, formData.weight) || 0)}
                        </Text>
                      </View>
                    )}

                  {/* Medical Survey Section */}
                  <View marginT-s6 marginB-s4 paddingB-s2 style={{ borderBottomWidth: 1, borderBottomColor: Colors.border }}>
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
                    <Text body textSecondary center marginT-s2>
                      اختر ما ينطبق على فرد العائلة من الحالات التالية
                    </Text>
                  </View>

                  <View marginB-s4>
                    <ArabicText bodySmall right marginB-s2 style={{ color: Colors.text }}>نمط الحياة</ArabicText>
                    <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                      {['قلة النشاط البدني', 'تدخين التبغ'].map((condition) => renderConditionChip(condition))}
                    </View>
                  </View>

                  <View marginB-s4>
                    <ArabicText bodySmall right marginB-s2 style={{ color: Colors.text }}>الحالات المزمنة</ArabicText>
                    <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                      {['مرض ارتفاع ضغط الدم', 'داء السكري', 'تاريخ لمرض قلبي وعائي', 'مرض عضوي مزمن'].map((condition) => renderConditionChip(condition))}
                    </View>
                  </View>

                  <View marginB-s4>
                    <ArabicText bodySmall right marginB-s2 style={{ color: Colors.text }}>الحالات الأخرى</ArabicText>
                    <View row right style={{ flexWrap: 'wrap', gap: 8, flexDirection: 'row-reverse' }}>
                      {['قراءات مرتفعة لضغط الدم', 'تاريخ عائلي للسكري'].map((condition) => renderConditionChip(condition))}
                      {formData.gender === 'female' && (
                        <>
                          {renderConditionChip('تاريخ لسكري الحمل')}
                          {renderConditionChip('تاريخ جنسي')}
                        </>
                      )}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View row center style={{ gap: 12, marginTop: 24 }}>
                    <Button
                      label={editingMember ? t("common.save") : t("family.add")}
                      backgroundColor={Colors.primary}
                      style={{ flex: 1 }}
                      paddingV-16
                      borderRadius={200}
                      onPress={handleSubmit}
                      labelStyle={{ fontFamily: 'ReadexPro-Bold', fontSize: 16 }}
                    />
                    <Button
                      label={t("common.cancel")}
                      backgroundColor={Colors.error}
                      style={{ flex: 1 }}
                      paddingV-16
                      borderRadius={200}
                      onPress={() => {
                        setIsModalOpen(false);
                        setEditingMember(null);
                        resetForm();
                      }}
                      labelStyle={{ fontFamily: 'ReadexPro-Bold', fontSize: 16 }}
                    />
                  </View>
                </View>
              </Card>
            </ScrollView>

            {/* Condition Info Modal - Positioned relative to screen, not scroll content */}
            {selectedInfoCondition && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.7)',
                zIndex: 9999,
              }}>
                <View style={{ backgroundColor: Colors.card, borderRadius: 18, padding: 24, width: '90%', maxWidth: 400, margin: 16 }}>
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}
                    onPress={() => setSelectedInfoCondition(null)}
                  >
                    <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontFamily: 'ReadexPro-Bold', color: Colors.primary, marginBottom: 16, textAlign: 'center', marginTop: 12 }}>
                    {selectedInfoCondition}
                  </Text>
                  <Text style={{ fontSize: 15, fontFamily: 'ReadexPro', color: Colors.text, lineHeight: 24, textAlign: 'center' }}>
                    {conditionExplanations[selectedInfoCondition]}
                  </Text>
                  <Button
                    label="فهمت"
                    backgroundColor={Colors.primary}
                    paddingV-s4
                    marginT-s4
                    onPress={() => setSelectedInfoCondition(null)}
                    labelStyle={{ fontFamily: 'ReadexPro-Bold', fontSize: 16 }}
                    borderRadius={200}
                  />
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}


