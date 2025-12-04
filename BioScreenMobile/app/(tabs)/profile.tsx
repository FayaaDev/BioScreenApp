import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { View, Text, Card, Button, TouchableOpacity, TextField, Modal, LoaderScreen, Colors } from 'react-native-ui-lib';

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import { useRouter } from "expo-router";
import { FamilyManagement } from "../../components/FamilyManagement";
import { useTranslation } from "react-i18next";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import i18n from "../../lib/i18n";
import { changeRTLDirection } from "../../lib/rtlSetup";
import { medicalStorage } from "../../lib/medical-storage";
import { useTheme } from "../../context/ThemeContext";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { isDark, toggleTheme: contextToggleTheme } = useTheme();

  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
  });
  const [showAgreement, setShowAgreement] = useState(false);
  const isRTL = i18n.language.startsWith("ar");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleToggleTheme = () => {
    contextToggleTheme();
    showToast({
      title: !isDark ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري',
      type: 'success'
    });
  };

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setRefreshKey((prev) => prev + 1);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, [i18n]);

  useEffect(() => {
    AsyncStorage.getItem("local_user_id").then((id) => {
      if (id) {
        setUserId(id);
      } else {
        // Create a new local user ID if it doesn't exist
        const newUserId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        AsyncStorage.setItem("local_user_id", newUserId);
        setUserId(newUserId);
      }
    });
  }, []);

  // No API calls - using local storage only
  const isLoading = false;
  const userData = null;

  useEffect(() => {
    // Load user profile from local storage if needed
    const loadProfile = async () => {
      if (userId) {
        const profile = await medicalStorage.getUserProfile(userId);
        if (profile) {
          setFormData({
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
          });
        }
      }
    };
    loadProfile();
  }, [userId]);

  const handleSave = async () => {
    if (userId) {
      // Get existing profile to preserve all fields
      const existingProfile = await medicalStorage.getUserProfile(userId);
      
      if (existingProfile) {
        // Update only the fields we're editing, preserve everything else
        await medicalStorage.saveUserProfile(userId, {
          ...existingProfile,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
        });
      } else {
        // Create new profile if it doesn't exist
        await medicalStorage.saveUserProfile(userId, {
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          height: "",
          weight: "",
          isDiabetic: false,
          isHypertensive: false,
          isCholesterol: false,
          isSmoker: false,
          isSexuallyActive: false,
        });
      }
      
      // Invalidate queries to refresh profile data in all screens
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      
      setIsEditing(false);
      showToast({ title: t("profile.profileUpdated"), type: "success" });
    }
  };

  const handleCancel = async () => {
    if (userId) {
      const profile = await medicalStorage.getUserProfile(userId);
      if (profile) {
        setFormData({
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
        });
      }
    }
    setIsEditing(false);
  };

  const handleResetProfile = async () => {
    const userId = await AsyncStorage.getItem("local_user_id");
    if (userId) {
      await medicalStorage.clearUserData(userId);
    }
    await AsyncStorage.removeItem("local_user_id");
    showToast({ title: t("profile.profileReset"), type: "success" });
    router.replace("/onboarding");
  };

  const handleDeleteData = async () => {
    try {
      // Get userId before clearing
      const userId = await AsyncStorage.getItem("local_user_id");
      
      // Clear medical storage first
      if (userId) {
        await medicalStorage.clearUserData(userId);
      }
      
      // Clear all AsyncStorage data
      await AsyncStorage.clear();
      
      showToast({ title: t("profile.dataDeleted"), type: "success" });
      
      // Small delay to ensure storage is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to intro page
      router.replace("/intro");
    } catch (error) {
      console.error('Error deleting data:', error);
      showToast({ title: t("common.error"), type: "error" });
    }
  };

  const handleSwitchPerson = (id: string) => {
    showToast({
      title: id === "user" ? t("family.yourself") : t("family.memberUpdated"),
      type: "info",
    });
  };

  const handleToggleLanguage = async () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    await i18n.changeLanguage(newLang);
    await changeRTLDirection(newLang === 'ar');
  };

  if (!userId || isLoading) {
    return (
      <LoaderScreen color={Colors.primary} message={t("common.loading")} backgroundColor={Colors.background} />
    );
  }

  return (
    <View
      flex
      padding-s4
      style={{ backgroundColor: Colors.background }}
    >
      <ScrollView
        key={refreshKey}
        style={{ flex: 1, backgroundColor: Colors.background, paddingTop: 48 }}
        contentContainerStyle={{ paddingBottom: 64 }}
      >
        <Card padding-s5 backgroundColor={Colors.card} br40 marginB-s4>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: 16,
            }}
          >
            <Text
              text60
              style={{
                fontFamily: 'ReadexPro-Bold',
                lineHeight: 30,
                color: Colors.text,
              }}
            >
              {t("profile.title")}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TouchableOpacity 
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.background,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={async () => {
                  const newLang = i18n.language === 'ar' ? 'en' : 'ar';
                  await i18n.changeLanguage(newLang);
                  await changeRTLDirection(newLang === 'ar');
                }}
              >
                <Text style={{ fontFamily: 'ReadexPro-Bold', fontSize: 14, color: Colors.primary }}>
                  {i18n.language === 'ar' ? 'EN' : 'ع'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.background,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleToggleTheme}
              >
                <Ionicons 
                  name={isDark ? 'sunny-outline' : 'moon-outline'} 
                  size={20} 
                  color={Colors.primary} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: Colors.background,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => router.push("/onboarding")}
              >
                <MaterialIcons name="edit" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text text70 center style={{ fontFamily: 'ReadexPro-Medium', color: Colors.text }}>{t("profile.dateOfBirth")}</Text>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setTempDate(
                        formData.dateOfBirth
                          ? new Date(formData.dateOfBirth)
                          : new Date(),
                      );
                      setShowDatePicker(true);
                    }}
                  >
                    <View padding-s3 br20 backgroundColor={Colors.background} marginT-s1 marginB-s1>
                      <Text
                        center
                        style={{
                          color: formData.dateOfBirth ? Colors.text : Colors.textSecondary,
                          fontFamily: "ReadexPro",
                        }}
                      >
                        {formData.dateOfBirth
                          ? new Date(formData.dateOfBirth).toLocaleDateString(
                            isRTL ? "ar-EG" : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )
                          : t("family.selectDateOfBirth")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {showDatePicker && (
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
                              if (selectedDate) setTempDate(selectedDate);
                            }}
                            maximumDate={new Date()}
                            minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 120))}
                            style={{ width: '100%', height: 180 }}
                            textColor={Colors.text}
                            themeVariant={isDark ? "dark" : "light"}
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
                                }
                                setShowDatePicker(false);
                              }}
                              labelStyle={{ fontFamily: 'ReadexPro-SemiBold', fontSize: 16, color: Colors.white }}
                            />
                          </View>
                        </View>
                      </View>
                    </Modal>
                  )}
                </>
              ) : (
                <Text text70 center marginV-s1 style={{ fontFamily: 'ReadexPro', color: Colors.text }}>
                  {formData.dateOfBirth
                    ? new Date(formData.dateOfBirth).toLocaleDateString(
                      isRTL ? "ar-EG" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )
                    : "-"}
                </Text>
              )}
            </View>
            <View style={{ gap: 8 }}>
              <Text text70 center style={{ fontFamily: 'ReadexPro-Medium', color: Colors.text }}>{t("profile.gender")}</Text>
              <View row center style={{ gap: 16, marginTop: 12 }}>
                <View
                  style={{
                    flex: 1,
                    minHeight: 56,
                    borderWidth: 2,
                    borderColor: formData.gender === "male" ? Colors.primary : Colors.textSecondary,
                    backgroundColor: formData.gender === "male" ? Colors.primary : Colors.card,
                    borderRadius: 20,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    elevation: formData.gender === "male" ? 4 : 0,
                    shadowColor: formData.gender === "male" ? Colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    marginHorizontal: 4,
                  }}
                >
                  <MaterialIcons
                    name="male"
                    size={20}
                    color={formData.gender === "male" ? Colors.white : Colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.gender === "male" ? Colors.white : Colors.textSecondary,
                      writingDirection: 'rtl',
                      fontSize: 15,
                      lineHeight: 24,
                    }}
                  >
                    {t("common.male")}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    minHeight: 56,
                    borderWidth: 2,
                    borderColor: formData.gender === "female" ? Colors.primary : Colors.textSecondary,
                    backgroundColor: formData.gender === "female" ? Colors.primary : Colors.card,
                    borderRadius: 20,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    elevation: formData.gender === "female" ? 4 : 0,
                    shadowColor: formData.gender === "female" ? Colors.primary : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    marginHorizontal: 4,
                  }}
                >
                  <MaterialIcons
                    name="female"
                    size={20}
                    color={formData.gender === "female" ? Colors.white : Colors.textSecondary}
                  />
                  <Text
                    style={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.gender === "female" ? Colors.white : Colors.textSecondary,
                      writingDirection: 'rtl',
                      fontSize: 15,
                      lineHeight: 24,
                    }}
                  >
                    {t("common.female")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {isEditing ? (
            <View row style={{ gap: 12, marginTop: 16 }}>
              <Button
                flex
                label={t("common.save")}
                backgroundColor={Colors.primary}
                paddingV-s5
                br20
                labelStyle={{ color: Colors.white, fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
                onPress={handleSave}
              />
              <Button
                flex
                label={t("common.cancel")}
                backgroundColor="transparent"
                outline
                outlineColor={Colors.error}
                paddingV-s5
                br20
                labelStyle={{ color: Colors.error, fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
                onPress={handleCancel}
                style={{ borderWidth: 1, borderColor: Colors.error }}
              />
            </View>
          ) : null}
        </Card>

        {/* Family Management Section */}
        <Card padding-s5 backgroundColor={Colors.card} br40 marginB-s4>
          <FamilyManagement
            userId={userId!}
            onSwitchPerson={handleSwitchPerson}
          />
        </Card>

        {/* Delete Data and User Agreement */}
        <Card padding-s5 backgroundColor={Colors.card} br40 marginB-s4>
          <Button
            label={t("profile.deleteData")}
            backgroundColor="transparent"
            outline
            outlineColor={Colors.error}
            paddingV-s5
            borderRadius={200}
            marginB-s3
            labelStyle={{ color: Colors.error, fontSize: 16, fontFamily: 'ReadexPro-Bold' }}
            onPress={handleDeleteData}
            style={{ borderWidth: 1, borderColor: Colors.error }}
          />
          <Button
            label={t("profile.userAgreement")}
            backgroundColor={Colors.primary}
            paddingV-s5
            borderRadius={200}
            labelStyle={{ color: Colors.white, fontSize: 16, fontFamily: 'ReadexPro-Bold' }}
            onPress={() => setShowAgreement(true)}
          />
        </Card>

        {/* User Agreement Modal */}
        <Modal
          visible={showAgreement}
          onDismiss={() => setShowAgreement(false)}
          overlayBackgroundColor={Colors.overlay}
        >
          <View flex center padding-s6 backgroundColor={Colors.background}>
            <ScrollView
              contentContainerStyle={{ alignItems: 'center', gap: 16, paddingTop: 60, paddingBottom: 32 }}
            >
              <Text text60 center marginB-s3 style={{ fontFamily: 'ReadexPro-Bold', color: Colors.primary }}>
                {t("profile.userAgreementTitle")}
              </Text>
              <Text text70 right marginB-s4 style={{ lineHeight: 29, paddingHorizontal: 16, fontFamily: 'ReadexPro', writingDirection: 'rtl', color: Colors.text }}>
                {t("profile.userAgreementContent")}
              </Text>
              <Button
                label={t("common.close")}
                backgroundColor={Colors.primary}
                paddingV-s3
                paddingH-s8
                br20
                marginT-s4
                labelStyle={{ color: Colors.white, fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold' }}
                onPress={() => setShowAgreement(false)}
              />
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
