import { useEffect, useState } from "react";
import {
  TextInput as RNTextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { View, Text, Card, Button, TouchableOpacity, Checkbox } from 'react-native-ui-lib';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../hooks/useToast";
import { medicalStorage } from "../lib/medical-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FamilyMember {
  id: string;
  userId: string;
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
    partnerCount: "single" | "multiple";
  };
}

export function FamilyManagement({
  userId,
  onSwitchPerson,
}: {
  userId: string;
  onSwitchPerson?: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  
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
    isDiabetic: false,
    isHypertensive: false,
    isCholesterol: false,
    isSmoker: false,
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
      const newMember: FamilyMember = {
        ...data,
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString(),
      };
      await medicalStorage.saveFamilyMember(userId, newMember);
      return newMember;
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
      isDiabetic: false,
      isHypertensive: false,
      isCholesterol: false,
      isSmoker: false,
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

    if (formData.isSmoker) {
      if (!formData.smokingDetails?.amount) {
        newErrors.smokingAmount = t("family.validation.smokingAmountRequired");
      } else if (
        isNaN(parseFloat(formData.smokingDetails.amount)) ||
        parseFloat(formData.smokingDetails.amount) <= 0
      ) {
        newErrors.smokingAmount = t("family.validation.smokingAmountInvalid");
      }

      if (!formData.smokingDetails?.duration) {
        newErrors.smokingDuration = t(
          "family.validation.smokingDurationRequired",
        );
      } else if (
        isNaN(parseFloat(formData.smokingDetails.duration)) ||
        parseFloat(formData.smokingDetails.duration) <= 0
      ) {
        newErrors.smokingDuration = t(
          "family.validation.smokingDurationInvalid",
        );
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
      updateFamilyMemberMutation.mutate({
        id: editingMember.id,
        data: formData,
      });
    } else {
      createFamilyMemberMutation.mutate(formData);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      relationship: member.relationship,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      isDiabetic: member.isDiabetic ?? false,
      isHypertensive: member.isHypertensive ?? false,
      isCholesterol: member.isCholesterol ?? false,
      isSmoker: member.isSmoker ?? false,
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

  const calculatePackYears = (smokingDetails: {
    amount: string;
    duration: string;
  }): number => {
    const amount = parseFloat(smokingDetails.amount);
    const duration = parseFloat(smokingDetails.duration);
    return amount * duration;
  };

  return (
    <>
      <Text text70 center style={{ fontFamily: 'ReadexPro-Bold', marginBottom: 12, color: '#045468' }}>{t("family.title")}</Text>
      {isLoading ? (
        <ActivityIndicator size="large" color="#4CCCE6" />
      ) : (
        <ScrollView
          style={{ maxHeight: 300 }}
          contentContainerStyle={{ gap: 12 }}
        >
          {!familyMembers || familyMembers.length === 0 ? (
            <Text center grey40 text70 style={{ fontFamily: 'ReadexPro', marginTop: 32 }}>{t("family.noMembers")}</Text>
          ) : (
            familyMembers.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <TouchableOpacity
                  style={styles.memberInfo}
                  onPress={() => handleSwitch(member.id)}
                >
                  <Text style={styles.memberName}>{member.relationship}</Text>
                  <Text style={styles.memberDetails}>
                    {member.gender === "male"
                      ? t("common.male")
                      : t("common.female")}
                  </Text>
                  <Text style={styles.memberDetails}>
                    {t("family.dateOfBirthLabel")}: {member.dateOfBirth}
                  </Text>
                  {member.isSmoker && member.smokingDetails && (
                    <View style={styles.packYearsBox}>
                      <Text
                        style={[
                          styles.packYearsLabel,
                          { textAlign: "left", width: "100%" },
                        ]}
                      >
                        {t("family.medicalSurvey.packYears")}:
                      </Text>
                      <Text
                        style={[
                          styles.packYearsValue,
                          { textAlign: "left", width: "100%" },
                        ]}
                      >
                        {calculatePackYears(member.smokingDetails)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(member)}
                  >
                    <Text style={styles.editButtonText}>
                      {t("family.edit")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(member.id)}
                  >
                    <Text style={styles.deleteButtonText}>
                      {t("family.delete")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <Button
        label={t("family.addMember")}
        backgroundColor="#045468"
        marginT-s4
        style={{ opacity: familyMembers && familyMembers.length >= 5 ? 0.5 : 1 }}
        disabled={familyMembers && familyMembers.length >= 5}
        onPress={() => {
          if (familyMembers && familyMembers.length >= 5) {
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
      {familyMembers && familyMembers.length >= 5 && (
        <Text
          style={{
            color: "#ef4444",
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
        animationType="slide"
        onRequestClose={() => setIsModalOpen(false)}
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
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>
                {editingMember
                  ? t("family.editMember")
                  : t("family.addMember")}
              </Text>
              <RNTextInput
                style={[
                  styles.input,
                  { textAlign: "left", writingDirection: "ltr" },
                  submitAttempted &&
                    validationErrors.relationship &&
                    styles.inputError,
                ]}
                placeholder={t("family.relationship")}
                placeholderTextColor="#999"
                value={formData.relationship}
                onChangeText={(text) => {
                  setFormData({ ...formData, relationship: text });
                  if (validationErrors.relationship) {
                    setValidationErrors((prev) => ({
                      ...prev,
                      relationship: "",
                    }));
                  }
                }}
              />
              {submitAttempted && validationErrors.relationship && (
                <Text style={styles.errorText}>
                  {validationErrors.relationship}
                </Text>
              )}

              <View
                style={{ alignItems: "center", width: "100%", marginTop: 16 }}
              >
                <Text
                  style={[
                    styles.label,
                    { textAlign: "center", alignSelf: "center" },
                  ]}
                >
                  {t("profile.gender")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === "male" &&
                        styles.genderButtonSelected,
                      submitAttempted &&
                        validationErrors.gender &&
                        styles.inputError,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, gender: "male" });
                      if (validationErrors.gender) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          gender: "",
                        }));
                      }
                    }}
                  >
                    <MaterialIcons
                      name="male"
                      size={20}
                      color={formData.gender === "male" ? "#fff" : "#4CCCE6"}
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === "male" &&
                          styles.genderButtonTextSelected,
                      ]}
                    >
                      {t("common.male")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.genderButton,
                      formData.gender === "female" &&
                        styles.genderButtonSelected,
                      submitAttempted &&
                        validationErrors.gender &&
                        styles.inputError,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, gender: "female" });
                      if (validationErrors.gender) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          gender: "",
                        }));
                      }
                    }}
                  >
                    <MaterialIcons
                      name="female"
                      size={20}
                      color={
                        formData.gender === "female" ? "#fff" : "#4CCCE6"
                      }
                    />
                    <Text
                      style={[
                        styles.genderButtonText,
                        formData.gender === "female" &&
                          styles.genderButtonTextSelected,
                      ]}
                    >
                      {t("common.female")}
                    </Text>
                  </TouchableOpacity>
                </View>
                {submitAttempted && validationErrors.gender && (
                  <Text style={styles.errorText}>
                    {validationErrors.gender}
                  </Text>
                )}
              </View>
              <View
                style={{ alignItems: "center", width: "100%", marginTop: 16 }}
              >
                <Text
                  style={[
                    styles.label,
                    { textAlign: "center", alignSelf: "center" },
                  ]}
                >
                  {t("family.dateOfBirthLabel")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    submitAttempted &&
                      validationErrors.dateOfBirth &&
                      styles.inputError,
                  ]}
                  onPress={() => {
                    setTempDate(
                      formData.dateOfBirth
                        ? new Date(formData.dateOfBirth)
                        : new Date(),
                    );
                    setShowDatePicker(true);
                  }}
                >
                  <Text
                    style={{
                      color: formData.dateOfBirth ? "#374151" : "#888",
                      textAlign: "left",
                    }}
                  >
                    {formData.dateOfBirth
                      ? new Date(formData.dateOfBirth).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )
                      : t("family.selectDateOfBirth")}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={tempDate || new Date()}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    minimumDate={
                      new Date(
                        new Date().setFullYear(
                          new Date().getFullYear() - 120,
                        ),
                      )
                    }
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFormData({
                          ...formData,
                          dateOfBirth: selectedDate
                            .toISOString()
                            .split("T")[0],
                        });
                        if (validationErrors.dateOfBirth) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            dateOfBirth: "",
                          }));
                        }
                      }
                      setShowDatePicker(false);
                      setTempDate(null);
                    }}
                    style={{ alignSelf: "flex-end", width: "100%" }}
                    textColor="#FFFFFF"
                  />
                )}
                {submitAttempted && validationErrors.dateOfBirth && (
                  <Text style={styles.errorText}>
                    {validationErrors.dateOfBirth}
                  </Text>
                )}
              </View>
              {/* Medical Survey Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t("family.healthData")}
                </Text>
                {/* Height */}
                <View style={styles.inputContainer}>
                  <Text
                    style={[
                      styles.label,
                      { textAlign: "left", alignSelf: "flex-start" },
                    ]}
                  >
                    {t("family.height")}
                  </Text>
                  <RNTextInput
                    style={[
                      styles.input,
                      { textAlign: "left", writingDirection: "ltr" },
                      submitAttempted &&
                        validationErrors.height &&
                        styles.inputError,
                    ]}
                    placeholder={t("family.heightPlaceholder")}
                    placeholderTextColor="#999"
                    value={formData.height}
                    onChangeText={(text) => {
                      setFormData((prev) => ({ ...prev, height: text }));
                      if (validationErrors.height) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          height: "",
                        }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {submitAttempted && validationErrors.height && (
                  <Text style={styles.errorText}>
                    {validationErrors.height}
                  </Text>
                )}
                {/* Weight */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.label, { textAlign: "left" }]}>
                    {t("family.weight")}
                  </Text>
                  <RNTextInput
                    style={[
                      styles.input,
                      { textAlign: "left", writingDirection: "ltr" },
                      submitAttempted &&
                        validationErrors.weight &&
                        styles.inputError,
                    ]}
                    placeholder={t("family.weightPlaceholder")}
                    placeholderTextColor="#999"
                    value={formData.weight}
                    onChangeText={(text) => {
                      setFormData((prev) => ({ ...prev, weight: text }));
                      if (validationErrors.weight) {
                        setValidationErrors((prev) => ({
                          ...prev,
                          weight: "",
                        }));
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                {submitAttempted && validationErrors.weight && (
                  <Text style={styles.errorText}>
                    {validationErrors.weight}
                  </Text>
                )}
                {formData.height &&
                  formData.weight &&
                  calculateBMI(formData.height, formData.weight) && (
                    <View style={styles.bmiBox}>
                      <Text
                        style={[
                          styles.bmiLabel,
                          { textAlign: "left", width: "100%" },
                        ]}
                      >
                        {t("family.bmi")}:
                      </Text>
                      <Text
                        style={[
                          styles.bmiValue,
                          { textAlign: "left", width: "100%" },
                        ]}
                      >
                        {calculateBMI(
                          formData.height,
                          formData.weight,
                        )?.toFixed(1)}
                      </Text>
                      <Text
                        style={[
                          styles.bmiCategoryText,
                          { textAlign: "left", width: "100%" },
                        ]}
                      >
                        {getBMICategory(
                          calculateBMI(formData.height, formData.weight) || 0,
                        )}
                      </Text>
                    </View>
                  )}
              </View>

              <View style={styles.medicalSurveyContainer}>
                <View style={styles.questionContainer}>
                  <Checkbox
                    value={formData.isDiabetic}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isDiabetic: value })
                    }
                    label={t("family.medicalSurvey.diabetic")}
                    color="#045468"
                    labelStyle={styles.checkboxLabel}
                    containerStyle={styles.checkboxContainer}
                  />
                </View>

                <View style={styles.questionContainer}>
                  <Checkbox
                    value={formData.isHypertensive}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isHypertensive: value })
                    }
                    label={t("family.medicalSurvey.hypertensive")}
                    color="#045468"
                    labelStyle={styles.checkboxLabel}
                    containerStyle={styles.checkboxContainer}
                  />
                </View>

                <View style={styles.questionContainer}>
                  <Checkbox
                    value={formData.isCholesterol}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isCholesterol: value })
                    }
                    label={t("family.medicalSurvey.cholesterol")}
                    color="#045468"
                    labelStyle={styles.checkboxLabel}
                    containerStyle={styles.checkboxContainer}
                  />
                </View>

                <View style={styles.questionContainer}>
                  <Checkbox
                    value={formData.isSmoker}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isSmoker: value })
                    }
                    label={t("family.medicalSurvey.smoker")}
                    color="#045468"
                    labelStyle={styles.checkboxLabel}
                    containerStyle={styles.checkboxContainer}
                  />
                </View>

                {formData.isSmoker && (
                  <View style={styles.smokingDetailsContainer}>
                    <RNTextInput
                      style={[
                        styles.input,
                        {
                          textAlign: "left",
                          writingDirection: "ltr",
                          alignSelf: "flex-start",
                        },
                        submitAttempted &&
                          validationErrors.smokingAmount &&
                          styles.inputError,
                      ]}
                      placeholder={t("family.medicalSurvey.smokingAmount")}
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
                          setValidationErrors((prev) => ({
                            ...prev,
                            smokingAmount: "",
                          }));
                        }
                      }}
                      keyboardType="numeric"
                    />
                    {submitAttempted && validationErrors.smokingAmount && (
                      <Text style={styles.errorText}>
                        {validationErrors.smokingAmount}
                      </Text>
                    )}
                    <RNTextInput
                      style={[
                        styles.input,
                        {
                          textAlign: "left",
                          writingDirection: "ltr",
                          alignSelf: "flex-start",
                        },
                        submitAttempted &&
                          validationErrors.smokingDuration &&
                          styles.inputError,
                      ]}
                      placeholder={t("family.medicalSurvey.smokingDuration")}
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
                          setValidationErrors((prev) => ({
                            ...prev,
                            smokingDuration: "",
                          }));
                        }
                      }}
                      keyboardType="numeric"
                    />
                    {submitAttempted && validationErrors.smokingDuration && (
                      <Text style={styles.errorText}>
                        {validationErrors.smokingDuration}
                      </Text>
                    )}
                    {formData.smokingDetails.amount &&
                      formData.smokingDetails.duration && (
                        <View style={styles.packYearsBox}>
                          <Text
                            style={[
                              styles.packYearsLabel,
                              { textAlign: "left", width: "100%" },
                            ]}
                          >
                            {t("family.medicalSurvey.packYears")}:
                          </Text>
                          <Text
                            style={[
                              styles.packYearsValue,
                              { textAlign: "left", width: "100%" },
                            ]}
                          >
                            {calculatePackYears(formData.smokingDetails)}
                          </Text>
                        </View>
                      )}
                  </View>
                )}

                {formData.gender === "female" && (
                  <View style={styles.questionContainer}>
                    <Checkbox
                      value={formData.isPregnant}
                      onValueChange={(value) =>
                        setFormData({ ...formData, isPregnant: value })
                      }
                      label={t("family.medicalSurvey.pregnant")}
                      color="#045468"
                      labelStyle={styles.checkboxLabel}
                      containerStyle={styles.checkboxContainer}
                    />
                  </View>
                )}

                <View style={styles.questionContainer}>
                  <Checkbox
                    value={formData.isSexuallyActive}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isSexuallyActive: value })
                    }
                    label={t("family.medicalSurvey.sexuallyActive")}
                    color="#045468"
                    labelStyle={styles.checkboxLabel}
                    containerStyle={styles.checkboxContainer}
                  />
                </View>

                {formData.isSexuallyActive && (
                  <View style={styles.partnerCountContainer}>
                    <Text
                      style={[
                        styles.label,
                        { textAlign: "left", alignSelf: "flex-start" },
                      ]}
                    >
                      {t("family.medicalSurvey.partnerCount")}
                    </Text>
                    <View
                      style={[
                        styles.partnerCountButtons,
                        { flexDirection: "row" },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.partnerCountButton,
                          formData.sexualActivityDetails.partnerCount ===
                            "single" && styles.partnerCountButtonSelected,
                          submitAttempted &&
                            validationErrors.sexualActivityDetailsPartnerCount &&
                            styles.inputError,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            sexualActivityDetails: {
                              ...formData.sexualActivityDetails,
                              partnerCount: "single",
                            },
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.partnerCountButtonText,
                            formData.sexualActivityDetails.partnerCount ===
                              "single" &&
                              styles.partnerCountButtonTextSelected,
                          ]}
                        >
                          {t("family.medicalSurvey.singlePartner")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.partnerCountButton,
                          formData.sexualActivityDetails.partnerCount ===
                            "multiple" && styles.partnerCountButtonSelected,
                          submitAttempted &&
                            validationErrors.sexualActivityDetailsPartnerCount &&
                            styles.inputError,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            sexualActivityDetails: {
                              ...formData.sexualActivityDetails,
                              partnerCount: "multiple",
                            },
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.partnerCountButtonText,
                            formData.sexualActivityDetails.partnerCount ===
                              "multiple" &&
                              styles.partnerCountButtonTextSelected,
                          ]}
                        >
                          {t("family.medicalSurvey.multiplePartners")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  marginTop: 16,
                  justifyContent: "center",
                  alignSelf: "center",
                }}
              >
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSubmit}
                >
                  <Text style={styles.saveButtonText}>
                    {editingMember ? t("common.save") : t("family.add")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsModalOpen(false);
                    setEditingMember(null);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = {
  card: {
    backgroundColor: "#2E3130",
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
    color: "#4CCCE6",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "ReadexPro-Bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 32,
    fontFamily: "ReadexPro",
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202221",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CCCE6",
    fontFamily: "ReadexPro-Bold",
  },
  memberDetails: {
    fontSize: 14,
    color: "#94a3b8",
    fontFamily: "ReadexPro",
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#045468",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "ReadexPro-Bold",
  },
  deleteButton: {
    backgroundColor: "#444947",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "ReadexPro-Bold",
  },
  addButton: {
    backgroundColor: "#045468",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ReadexPro-Bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#202221",
  },
  modalContent: {
    alignItems: "center",
    gap: 16,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 24,
    width: "100%",
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CCCE6",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "ReadexPro-Bold",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#2E3130",
    color: "#ECEDEE",
    // width: "100%",
    width: 250,
    marginBottom: 8,
    fontFamily: "ReadexPro",
  },
  label: {
    fontSize: 16,
    color: "#ECEDEE",
    fontWeight: "500",
    marginBottom: 4,
    alignSelf: "flex-start",
    textAlign: "left",
    fontFamily: "ReadexPro-Medium",
  },
  optionButton: {
    backgroundColor: "#202221",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  optionButtonSelected: {
    backgroundColor: "#045468",
  },
  optionButtonText: {
    color: "#045468",
    fontWeight: "bold",
    fontFamily: "ReadexPro-Bold",
  },
  optionButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "ReadexPro-Bold",
  },
  saveButton: {
    backgroundColor: "#045468",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ReadexPro-Bold",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ReadexPro-Bold",
  },
  genderButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  genderButtonSelected: {
    backgroundColor: "#045468",
  },
  genderButtonText: {
    color: "#045468",
    fontWeight: "bold",
    fontFamily: "ReadexPro-Bold",
  },
  genderButtonTextSelected: {
    color: "#fff",
    fontFamily: "ReadexPro-Bold",
  },
  questionContainer: {
    gap: 8,
    width: "100%",
  },
  questionLabel: {
    fontSize: 16,
    color: "#ECEDEE",
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
    borderColor: "#045468",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  yesNoButtonSelected: {
    backgroundColor: "#045468",
  },
  yesNoButtonText: {
    fontSize: 16,
    color: "#045468",
    fontFamily: "ReadexPro-Bold",
  },
  yesNoButtonTextSelected: {
    color: "#fff",
    fontFamily: "ReadexPro-Bold",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CCCE6",
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
    borderColor: "#045468",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#ECEDEE",
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
    borderColor: "#045468",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  partnerCountButtonSelected: {
    backgroundColor: "#045468",
  },
  partnerCountButtonText: {
    fontSize: 14,
    color: "#045468",
    fontFamily: "ReadexPro-Bold",
  },
  partnerCountButtonTextSelected: {
    color: "#fff",
    fontFamily: "ReadexPro-Bold",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  bmiBox: {
    backgroundColor: "#e6faed",
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    alignItems: "flex-start",
  },
  bmiLabel: {
    color: "#009966",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    fontFamily: "ReadexPro-Bold",
  },
  bmiValue: {
    color: "#009966",
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 4,
    fontFamily: "ReadexPro-Bold",
  },
  bmiCategoryText: {
    color: "#666",
    fontSize: 16,
    fontFamily: "ReadexPro",
  },
  section: {
    marginTop: 24,
    width: "100%",
  },
  packYearsText: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
    fontFamily: "ReadexPro",
  },
  packYearsBox: {
    backgroundColor: "#fffbe6",
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    alignItems: "flex-start",
  },
  packYearsLabel: {
    color: "#bfa100",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    fontFamily: "ReadexPro-Bold",
  },
  packYearsValue: {
    color: "#bfa100",
    fontWeight: "bold",
    fontSize: 28,
    marginBottom: 4,
    fontFamily: "ReadexPro-Bold",
  },
  inputError: {
    borderColor: "#ef4444",
    borderWidth: 1,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
    textAlign: "left",
    alignSelf: "flex-start",
    fontFamily: "ReadexPro",
  },
  warningText: {
    color: "#f59e0b",
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
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 4,
    width: "100%",
  },
  datePickerModal: {
    backgroundColor: "#fff",
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
    backgroundColor: "#045468",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ReadexPro-Bold",
  },
  cancelDateButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  cancelDateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "ReadexPro-Bold",
  },
};
