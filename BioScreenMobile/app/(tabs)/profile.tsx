import React, { useEffect, useState } from "react";
import {
  TextInput as RNTextInput,
  ScrollView,
  ActivityIndicator,
  I18nManager,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { View, Text, Card, Button, TouchableOpacity } from 'react-native-ui-lib';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import { useRouter } from "expo-router";
import { FamilyManagement } from "../../components/FamilyManagement";
import { useTranslation } from "react-i18next";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import i18n from "../../lib/i18n";
import {
  PhoneNumberInput,
  validatePhoneNumber,
} from "../../components/PhoneNumberInput";
import { changeRTLDirection } from "../../lib/rtlSetup";

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
    name: "",
    email: "",
    phoneNumber: "+966",
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
    AsyncStorage.getItem("healthscreen_user_id").then((id) => {
      if (id) setUserId(id);
      else router.replace("/onboarding");
    });
  }, []);

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/users", userId],
    queryFn: () => apiRequest("GET", `/api/users/${userId}`),
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData && typeof userData === "object" && "user" in userData) {
      const user = userData.user as {
        name?: string;
        email?: string;
        phoneNumber?: string;
        dateOfBirth: string;
        gender: string;
      };
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "+966",
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      });
    }
  }, [userData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phoneNumber: string;
      dateOfBirth: string;
      gender: string;
    }) => {
      // Normalize email: trim whitespace, convert to lowercase, remove RTL markers
      const normalizedEmail = data.email
        .trim()
        .toLowerCase()
        .replace(/[\u200E\u200F\u202A-\u202E]/g, ""); // Remove RTL/LTR marks

      return apiRequest("PATCH", `/api/users/${userId}`, {
        ...data,
        email: normalizedEmail,
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId] });
      showToast({ title: t("profile.profileUpdated"), type: "success" });
    },
    onError: () => {
      showToast({
        title: t("common.error"),
        description: t("profile.updateError"),
        type: "error",
      });
    },
  });

  const handleSave = () => {
    // Validate phone number before saving
    const phoneError = validatePhoneNumber(formData.phoneNumber);
    if (phoneError) {
      showToast({
        title: t("profile.phoneNumberError"),
        description: phoneError,
        type: "error",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (userData && typeof userData === "object" && "user" in userData) {
      const user = userData.user as {
        name?: string;
        email?: string;
        phoneNumber?: string;
        dateOfBirth: string;
        gender: string;
      };
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "+966",
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
      });
    }
    setIsEditing(false);
  };

  const handleResetProfile = async () => {
    await AsyncStorage.removeItem("healthscreen_user_id");
    showToast({ title: t("profile.profileReset"), type: "success" });
    router.replace("/onboarding");
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("healthscreen_user_id");
    showToast({ title: t("profile.signOutSuccess"), type: "success" });
    router.replace("/login");
  };

  const handleSwitchPerson = (id: string) => {
    showToast({
      title: id === "user" ? t("family.yourself") : t("family.memberUpdated"),
      type: "info",
    });
  };

  if (!userId || isLoading) {
    return (
      <View flex center style={{ backgroundColor: '#202221' }}>
        <ActivityIndicator size="large" color="#4CCCE6" />
        <Text marginT-s3 text70 zimam-primary style={{ fontFamily: 'ReadexPro' }}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    AsyncStorage.removeItem("healthscreen_user_id");
    router.replace("/onboarding");
    return null;
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
              color: '#045468',
            }}
          >
            {t("profile.title")}
          </Text>
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text text70 white center style={{ fontFamily: 'ReadexPro-Medium' }}>{t("profile.name")}</Text>
              <RNTextInput
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: '#555',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  backgroundColor: '#2E3130',
                  color: '#ECEDEE',
                  fontFamily: 'ReadexPro',
                  textAlign: isRTL ? "right" : "left",
                  writingDirection: isRTL ? "rtl" : "ltr",
                }}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                editable={isEditing}
              />
            </View>
            <View style={{ gap: 8 }}>
              <Text text70 white center style={{ fontFamily: 'ReadexPro-Medium' }}>{t("profile.email")}</Text>
              <RNTextInput
                style={{
                  height: 48,
                  borderWidth: 1,
                  borderColor: '#555',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  backgroundColor: '#2E3130',
                  color: '#ECEDEE',
                  fontFamily: 'ReadexPro',
                  textAlign: isRTL ? "right" : "left",
                  writingDirection: isRTL ? "rtl" : "ltr",
                }}
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                editable={isEditing}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <PhoneNumberInput
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              editable={isEditing}
              required={true}
            />

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
              {isEditing || true ? (
                <View row center style={{ gap: 16, marginTop: 12 }}>
                  <TouchableOpacity
                    disabled={!isEditing}
                    onPress={() =>
                      isEditing && setFormData({ ...formData, gender: "male" })
                    }
                  >
                    <View
                      paddingV-s2
                      paddingH-s4
                      br20
                      center
                      backgroundColor={formData.gender === "male" ? "#045468" : "#202221"}
                      style={{ minWidth: 0, marginHorizontal: 4 }}
                    >
                      <MaterialIcons
                        name="male"
                        size={20}
                        color={formData.gender === "male" ? "#fff" : "#045468"}
                      />
                      <Text
                        text70
                        marginT-s1
                        style={{
                          color: formData.gender === "male" ? "#fff" : "#045468",
                          fontFamily: 'ReadexPro-Bold'
                        }}
                      >
                        {t("common.male")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={!isEditing}
                    onPress={() =>
                      isEditing &&
                      setFormData({ ...formData, gender: "female" })
                    }
                  >
                    <View
                      paddingV-s2
                      paddingH-s4
                      br20
                      center
                      backgroundColor={formData.gender === "female" ? "#045468" : "#202221"}
                      style={{ minWidth: 0, marginHorizontal: 4 }}
                    >
                      <MaterialIcons
                        name="female"
                        size={20}
                        color={formData.gender === "female" ? "#fff" : "#045468"}
                      />
                      <Text
                        text70
                        marginT-s1
                        style={{
                          color: formData.gender === "female" ? "#fff" : "#045468",
                          fontFamily: 'ReadexPro-Bold'
                        }}
                      >
                        {t("common.female")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : null}
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
                disabled={updateProfileMutation.isPending}
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
            br20
            marginB-s2
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
            onPress={handleSignOut}
          />
          <Button
            label={t("profile.userAgreement")}
            backgroundColor="#045468"
            paddingV-s5
            br20
            labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 16, fontFamily: 'ReadexPro-Bold', lineHeight: 29 }}
            onPress={() => setShowAgreement(true)}
          />
        </Card>

        {/* Language Selection Modal */}
        <Modal
          visible={showLanguageModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View
            flex
            center
            style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
          >
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
          animationType="slide"
          onRequestClose={() => setShowAgreement(false)}
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
