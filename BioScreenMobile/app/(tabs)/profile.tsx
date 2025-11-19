import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { View, Text, Card, Button, TouchableOpacity, TextField, Modal, LoaderScreen } from 'react-native-ui-lib';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import { useRouter } from "expo-router";
import { FamilyManagement } from "../../components/FamilyManagement";
import { useTranslation } from "react-i18next";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import i18n from "../../lib/i18n";
import { changeRTLDirection } from "../../lib/rtlSetup";
import { medicalStorage } from "../../lib/medical-storage";

/**
* After fetching docs about RTL setup from here, see what's going wrong in this app
* The app is always set to RTL direction
* Despite console reporting LTR as well as @DirectionTester.tsx component
 * https://docs.expo.dev/guides/localization/#making-an-app-behave-correctly-on-rtl-locales
 */
export default function Profile() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: "",
    gender: "",
  });
  const [showAgreement, setShowAgreement] = useState(false);
  const isRTL = i18n.language === "ar";
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
      await medicalStorage.saveUserProfile(userId, {
        ...formData,
        isDiabetic: false,
        isHypertensive: false,
        isCholesterol: false,
        isSmoker: false,
        height: "",
        weight: "",
        isSexuallyActive: false,
      });
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

  const handleSignOut = async () => {
    const userId = await AsyncStorage.getItem("local_user_id");
    if (userId) {
      await medicalStorage.clearUserData(userId);
    }
    await AsyncStorage.removeItem("local_user_id");
    showToast({ title: t("profile.signOutSuccess"), type: "success" });
    router.replace("/onboarding");
  };

  const handleSwitchPerson = (id: string) => {
    showToast({
      title: id === "user" ? t("family.yourself") : t("family.memberUpdated"),
      type: "info",
    });
  };

  if (!userId || isLoading) {
    return (
      <LoaderScreen color="#4CCCE6" message={t("common.loading")} backgroundColor="#202221" />
    );
  }

  return (
    <View
      flex
      padding-s4
      style={{ backgroundColor: '#202221' }}
    >
      <ScrollView
        key={refreshKey}
        style={{ flex: 1, backgroundColor: '#202221', paddingTop: 48 }}
        contentContainerStyle={{ paddingBottom: 64 }}
      >
        <Card padding-s5 backgroundColor="#2E3130" br40 marginB-s4>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 2,
              gap: 12,
            }}
          >
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <MaterialIcons name="edit" size={28} color="#4CCCE6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
              <MaterialIcons name="language" size={28} color="#4CCCE6" />
            </TouchableOpacity>
          </View>
          <Text
            text60
            center
            marginB-s4
            style={{
              fontFamily: 'ReadexPro-Bold',
              lineHeight: 30,
              color: '#fff',
            }}
          >
            {t("profile.title")}
          </Text>
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text text70 white center style={{ fontFamily: 'ReadexPro-Medium' }}>{t("profile.dateOfBirth")}</Text>
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
                    <View padding-s3 br20 backgroundColor="#202221" marginT-s1 marginB-s1>
                      <Text
                        center
                        style={{
                          color: formData.dateOfBirth ? "#374151" : "#888",
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
                    <DateTimePicker
                      value={tempDate || new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "calendar"}
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
                        }
                        setShowDatePicker(false);
                        setTempDate(null);
                      }}
                      style={{ alignSelf: "flex-end", width: "100%" }}
                      textColor="#FFFFFF"
                    />
                  )}
                </>
              ) : (
                <Text text70 white center marginV-s1 style={{ fontFamily: 'ReadexPro' }}>
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
              <Text text70 white center style={{ fontFamily: 'ReadexPro-Medium' }}>{t("profile.gender")}</Text>
              <View row center style={{ gap: 16, marginTop: 12 }}>
                <View
                  style={{
                    flex: 1,
                    minHeight: 56,
                    borderWidth: 2,
                    borderColor: formData.gender === "male" ? '#045468' : '#555',
                    backgroundColor: formData.gender === "male" ? '#045468' : '#2E3130',
                    borderRadius: 20,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    elevation: formData.gender === "male" ? 4 : 0,
                    shadowColor: formData.gender === "male" ? '#045468' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    marginHorizontal: 4,
                  }}
                >
                  <MaterialIcons
                    name="male"
                    size={20}
                    color={formData.gender === "male" ? "#fff" : "#888"}
                  />
                  <Text
                    style={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.gender === "male" ? '#fff' : '#888',
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
                    borderColor: formData.gender === "female" ? '#045468' : '#555',
                    backgroundColor: formData.gender === "female" ? '#045468' : '#2E3130',
                    borderRadius: 20,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    gap: 8,
                    elevation: formData.gender === "female" ? 4 : 0,
                    shadowColor: formData.gender === "female" ? '#045468' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    marginHorizontal: 4,
                  }}
                >
                  <MaterialIcons
                    name="female"
                    size={20}
                    color={formData.gender === "female" ? "#fff" : "#888"}
                  />
                  <Text
                    style={{
                      fontFamily: 'ReadexPro-Bold',
                      color: formData.gender === "female" ? '#fff' : '#888',
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
                backgroundColor="#4CCCE6"
                paddingV-s5
                br20
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
                onPress={handleSave}
              />
              <Button
                flex
                label={t("common.cancel")}
                backgroundColor="#ef4444"
                paddingV-s5
                br20
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
                onPress={handleCancel}
              />
            </View>
          ) : null}
        </Card>

        {/* Family Management Section */}
        <Card padding-s5 backgroundColor="#2E3130" br40 marginB-s4>
          <FamilyManagement
            userId={userId!}
            onSwitchPerson={handleSwitchPerson}
          />
        </Card>

        {/* Reset Profile and Sign Out */}
        <Card padding-s5 backgroundColor="#2E3130" br40 marginB-s4>
          <Button
            label={t("profile.signOut")}
            backgroundColor="#045468"
            paddingV-s5
            borderRadius={200}
            marginB-s3
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
            onPress={handleSignOut}
          />
          <Button
            label={t("profile.userAgreement")}
            backgroundColor="#045468"
            paddingV-s5
            borderRadius={200}
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
            onPress={() => setShowAgreement(true)}
          />
        </Card>

        {/* Language Selection Modal */}
        <Modal
          visible={showLanguageModal}
          onDismiss={() => setShowLanguageModal(false)}
          overlayBackgroundColor="rgba(0,0,0,0.7)"
        >
          <View flex center>
            <Card
              padding-s6
              backgroundColor="#2E3130"
              br40
              style={{ minWidth: 280 }}
            >
              <Text
                text70
                zimam-primary
                center
                marginB-s4
                style={{ fontFamily: "ReadexPro-Bold" }}
              >
                {t("profile.changeLanguage")}
              </Text>
              <Button
                label="العربية"
                backgroundColor={i18n.language === "ar" ? "#4CCCE6" : "#202221"}
                paddingV-s3
                br20
                marginB-s3
                labelStyle={{
                  color: i18n.language === "ar" ? "#fff" : "#4CCCE6",
                  fontWeight: "bold",
                  fontSize: 16,
                  fontFamily: "ReadexPro-Bold",
                }}
                onPress={async () => {
                  if (i18n.language !== "ar") {
                    await i18n.changeLanguage("ar");
                    setShowLanguageModal(false);
                    await changeRTLDirection(true);
                  } else {
                    setShowLanguageModal(false);
                  }
                }}
              />
              <Button
                label="English"
                backgroundColor={i18n.language === "en" ? "#4CCCE6" : "#202221"}
                paddingV-s3
                br20
                marginB-s1
                labelStyle={{
                  color: i18n.language === "en" ? "#fff" : "#4CCCE6",
                  fontWeight: "bold",
                  fontSize: 16,
                  fontFamily: "ReadexPro-Bold",
                }}
                onPress={async () => {
                  if (i18n.language !== "en") {
                    await i18n.changeLanguage("en");
                    setShowLanguageModal(false);
                    await changeRTLDirection(false);
                  } else {
                    setShowLanguageModal(false);
                  }
                }}
              />
              <TouchableOpacity
                marginT-s2
                center
                onPress={() => setShowLanguageModal(false)}
              >
                <Text
                  zimam-primary
                  text70
                  style={{ fontFamily: "ReadexPro-Bold" }}
                >
                  {t("common.close")}
                </Text>
              </TouchableOpacity>
            </Card>
          </View>
        </Modal>

        {/* User Agreement Modal */}
        <Modal
          visible={showAgreement}
          onDismiss={() => setShowAgreement(false)}
          overlayBackgroundColor="rgba(0,0,0,0.2)"
        >
          <View flex center padding-s6 backgroundColor="#202221">
            <ScrollView
              contentContainerStyle={{ alignItems: 'center', gap: 16, paddingTop: 60, paddingBottom: 32 }}
            >
              <Text text60 zimam-primary center marginB-s3 style={{ fontFamily: 'ReadexPro-Bold' }}>
                {t("profile.userAgreementTitle")}
              </Text>
              <Text text70 white right marginB-s4 style={{ lineHeight: 29, paddingHorizontal: 16, fontFamily: 'ReadexPro', writingDirection: 'rtl' }}>
                {t("profile.userAgreementContent")}
              </Text>
              <Button
                label={t("common.close")}
                backgroundColor="#4CCCE6"
                paddingV-s3
                paddingH-s8
                br20
                marginT-s4
                labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold' }}
                onPress={() => setShowAgreement(false)}
              />
            </ScrollView>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}
