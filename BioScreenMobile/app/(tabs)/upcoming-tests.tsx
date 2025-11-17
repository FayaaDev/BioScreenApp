import { useEffect, useState, useContext, useCallback } from "react";
import {
  ScrollView,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from "react-native";
import { View, Text, Card, Button, TouchableOpacity } from 'react-native-ui-lib';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/api";
import { useToast } from "../../hooks/useToast";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  STATUS_COLORS,
  calculateNextDueDate,
  ScreeningWithDetails,
} from "../../lib/screening-utils";
import Tooltip from "react-native-walkthrough-tooltip";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SelectedPersonContext } from "../../context/SelectedPersonContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "../../hooks/useColorScheme";
// import { ScreeningCard } from '../../components/ScreeningCard'; // Placeholder below

type UserDataResponse = {
  user: { name?: string; dateOfBirth: string; gender: string };
  screenings: ScreeningWithDetails[];
};

type FamilyMemberResponse = {
  familyMember: { name: string; dateOfBirth: string; gender: string };
  screenings: ScreeningWithDetails[];
};

// Helper function to get frequency text - now supports both languages
const getFrequencyText = (years: number, t: any) => {
  if (years === 0) return t("screening.frequency.oneTime");
  if (years === 1) return t("screening.frequency.everyYear");
  if (years === 2) return t("screening.frequency.every2Years");
  if (years === 3) return t("screening.frequency.every3Years");
  if (years === 4) return t("screening.frequency.every4Years");
  if (years === 5) return t("screening.frequency.every5Years");
  return t("screening.frequency.everyNYears", { years });
};

// Placeholder for ScreeningCard
const ScreeningCard = ({
  screening,
  onSchedule,
  onMarkCompleted,
  isRTL,
  userBirthDate,
}: {
  screening: ScreeningWithDetails;
  onSchedule: () => void;
  onMarkCompleted: () => void;
  isRTL: boolean;
  userBirthDate: string;
}) => {
  const [showTip, setShowTip] = useState(false);
  const { t } = useTranslation();
  const priority = screening.screening.priority;
  let priorityLabel = "";
  let priorityColor = "";
  if (priority === "strongly_recommended") {
    priorityLabel = t("screening.priority.stronglyRecommended");
    priorityColor = "#6B7280"; // grey
  } else if (priority === "recommended") {
    priorityLabel = t("screening.priority.recommended");
    priorityColor = "#9CA3AF"; // lighter grey
  }
  // Translate and color the status label for each status
  let statusLabel = screening.status;
  let statusLabelStyle = [styles.screeningStatus];
  if (screening.status === "later" || screening.status === "laterRecreated") {
    if (screening.status === "laterRecreated" && screening.nextDue) {
      statusLabel = t("home.later");
      const nextAppointmentText = t("screening.NextOPD", {
        date: new Date(screening.nextDue).toLocaleDateString("en-GB"),
      });
      statusLabelStyle = [
        styles.screeningStatus,
        {
          color: "#FFFFFF",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 2,
          alignSelf: "flex-end",
          overflow: "hidden",
          fontWeight: "bold",
        } as any,
      ];
      return (
        <Card
          backgroundColor="#2E3130"
          enableShadow
          elevation={3}
          style={[
            styles.screeningCard,
            { flexDirection: "row", position: "relative" },
          ]}
        >
          {/* Priority tag in top corner */}
          {priority && (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 2,
                backgroundColor: priorityColor,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 3,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: "bold",
                  fontFamily: "ReadexPro-Bold",
                }}
              >
                {priorityLabel}
              </Text>
            </View>
          )}
          {/* Details */}
          <View style={{ flex: 1 }}>
            {/* Name row: info icon, name */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.screeningTitle, { textAlign: "left" }]}>
                {screening.screening.name}
              </Text>
              {screening.screening?.description ? (
                <Tooltip
                  isVisible={showTip}
                  content={
                    <Text style={{ maxWidth: 200 }}>
                      {screening.screening.description}
                    </Text>
                  }
                  placement="top"
                  onClose={() => setShowTip(false)}
                  showChildInTooltip={false}
                  backgroundColor="rgba(0,0,0,0.2)"
                >
                  <TouchableOpacity
                    onPress={() => setShowTip(true)}
                    style={{ marginStart: 8 }}
                  >
                    <MaterialCommunityIcons
                      name="information-outline"
                      size={18}
                      color="#4CCCE6"
                    />
                  </TouchableOpacity>
                </Tooltip>
              ) : null}
            </View>
            {/* Status label below name row */}
            <View
              style={{ width: "100%", marginTop: 4, alignItems: "flex-start" }}
            >
              <View>
                <Text
                  style={[
                    ...statusLabelStyle,
                    { textAlign: "left", alignSelf: "flex-start" },
                  ]}
                >
                  {statusLabel}
                </Text>
              </View>
            </View>
            {/* Next appointment date for recreated tests */}
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                marginBottom: 2,
                textAlign: "left",
                fontWeight: "bold",
                fontFamily: "ReadexPro-Bold",
              }}
            >
              {nextAppointmentText}
            </Text>
            {/* Repetition frequency */}
            {typeof screening.screening?.frequencyYears === "number" && (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  marginTop: 2,
                  marginBottom: 2,
                  textAlign: "left",
                  fontFamily: "ReadexPro",
                }}
              >
                {getFrequencyText(screening.screening.frequencyYears, t)}
              </Text>
            )}
          </View>
          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TouchableOpacity style={styles.actionButton} onPress={onSchedule}>
              <Text style={styles.actionButtonText}>
                {t("screening.bookWithSehhaty")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMarkCompleted}
            >
              <Text style={styles.actionButtonText}>{t("screening.done")}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      );
    } else {
      statusLabel = t("home.later");
    }
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: "#FFFFFF",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-end",
        overflow: "hidden",
        fontWeight: "bold",
      } as any,
    ];
  } else if (screening.status === "due") {
    statusLabel = t("home.tabs.due");
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: "#0EB39E",
        backgroundColor: "rgba(14, 179, 158, 0.16)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-end",
        overflow: "hidden",
        fontWeight: "bold",
      } as any,
    ];
  } else if (screening.status === "overdue") {
    statusLabel = t("home.tabs.overdue");
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: "#A35829",
        backgroundColor: "rgba(163, 88, 41, 0.16)",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-end",
        overflow: "hidden",
        fontWeight: "bold",
      } as any,
    ];
  } else if (screening.status === "completed") {
    statusLabel = t("home.tabs.done");
    statusLabelStyle = [
      styles.screeningStatus,
      {
        color: "#22c55e", // green-600
        backgroundColor: "#f0fdf4", // green-50
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: "flex-end",
        overflow: "hidden",
        fontWeight: "bold",
      } as any,
    ];
  }
  // Add language detection (for i18n)
  const language = isRTL ? "ar" : "en";
  // Calculate overdue years if needed
  let overdueYears: number | null = null;
  if (
    screening.status === "overdue" &&
    screening.screening?.startAge &&
    userBirthDate
  ) {
    const birthDate = new Date(userBirthDate);
    const birthYear = birthDate.getFullYear();
    const targetYear = birthYear + screening.screening.startAge;
    const currentYear = new Date().getFullYear();
    overdueYears = currentYear - targetYear;
  }
  return (
    <Card
      backgroundColor="#2E3130"
      enableShadow
      elevation={3}
      style={[
        styles.screeningCard,
        { flexDirection: "row", position: "relative" },
      ]}
    >
      {/* Priority tag in top corner */}
      {priority && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
            backgroundColor: priorityColor,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 3,
            alignSelf: "flex-start",
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 12,
              fontWeight: "bold",
              fontFamily: "ReadexPro-Bold",
            }}
          >
            {priorityLabel}
          </Text>
        </View>
      )}
      {/* Details */}
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        {/* Name row: info icon, name */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[styles.screeningTitle, { textAlign: "left" }]}>
            {screening.screening.name}
          </Text>
          {screening.screening?.description ? (
            <Tooltip
              isVisible={showTip}
              content={
                <Text style={{ maxWidth: 200 }}>
                  {screening.screening.description}
                </Text>
              }
              placement="top"
              onClose={() => setShowTip(false)}
              showChildInTooltip={false}
              backgroundColor="rgba(0,0,0,0.2)"
            >
              <TouchableOpacity
                onPress={() => setShowTip(true)}
                style={{ marginStart: 8 }}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={18}
                  color="#4CCCE6"
                />
              </TouchableOpacity>
            </Tooltip>
          ) : null}
        </View>
        {/* Status label below name row */}
        <View style={{ width: "100%", marginTop: 4, alignItems: "flex-start" }}>
          <View>
            <Text
              style={[
                ...statusLabelStyle,
                { textAlign: "left", alignSelf: "flex-start" },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
        {/* Repetition date below status */}
        {(screening.status === "completed" ||
          screening.status === "due" ||
          (screening.status !== "overdue" &&
            screening.status !== "completed" &&
            screening.status !== "due")) &&
          typeof screening.screening?.frequencyYears === "number" && (
            <Text
              style={{
                color: "#fff",
                fontSize: 13,
                marginTop: 2,
                marginBottom: 2,
                textAlign: "left",
                fontFamily: "ReadexPro",
              }}
            >
              {getFrequencyText(screening.screening.frequencyYears, t)}
            </Text>
          )}
        {/* Next due message (only for original later, not recreated) */}
        {screening.status === "later" &&
          typeof screening.screening?.startAge === "number" &&
          userBirthDate && (
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                marginBottom: 2,
                textAlign: "left",
                fontFamily: "ReadexPro",
              }}
            >
              {t("screening.takeAtAge", { age: screening.screening.startAge })}
            </Text>
          )}
        {/* Overdue years label */}
        {screening.status === "overdue" &&
          overdueYears !== null &&
          overdueYears > 0 && (
            <Text
              style={{
                color: "#fff",
                fontSize: 14,
                marginBottom: 2,
                textAlign: "left",
                fontFamily: "ReadexPro",
              }}
            >
              {t("screening.overdueYears", {
                years: overdueYears,
                count: overdueYears,
              })}
            </Text>
          )}
      </View>
      {/* Buttons */}
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TouchableOpacity style={styles.actionButton} onPress={onSchedule}>
          <Text style={styles.actionButtonText}>
            {t("screening.bookWithSehhaty")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onMarkCompleted}>
          <Text style={styles.actionButtonText}>{t("screening.done")}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const diff = Date.now() - dob.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return age;
}

function calculateScreeningStats(screenings: ScreeningWithDetails[]) {
  const stats = { due: 0, overdue: 0, later: 0, completed: 0 };
  screenings.forEach((s) => {
    if (s.status === "due") stats.due++;
    else if (s.status === "overdue") stats.overdue++;
    else if (s.status === "later") stats.later++;
    else if (s.status === "completed") stats.completed++;
  });
  return stats;
}

function filterScreeningsByStatus(
  screenings: ScreeningWithDetails[],
  status: string,
) {
  if (status === "all") {
    // For 'all' status, show all screenings except completed non-repeatable ones
    return screenings.filter((s) => {
      if (s.status !== "completed") return true;
      // For completed screenings, only show repeatable ones with a next due date
      return s.screening.frequencyYears > 0 && s.nextDue;
    });
  }
  return screenings.filter((s) => s.status === status);
}

// Add sorting function for screenings
function sortScreenings(screenings: ScreeningWithDetails[]) {
  const statusOrder = { due: 1, overdue: 2, later: 0 };
  return [...screenings].sort((a, b) => {
    // First sort by status
    const statusDiff =
      (statusOrder[a.status as keyof typeof statusOrder] || 3) -
      (statusOrder[b.status as keyof typeof statusOrder] || 3);
    if (statusDiff !== 0) return statusDiff;

    // Then sort by name
    return (a.screening.name || "").localeCompare(b.screening.name || "");
  });
}

export default function UpcomingTests() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const { selectedPersonId, setSelectedPersonId } = useContext(
    SelectedPersonContext,
  );
  const isRTL = i18n.language === "ar";
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      setRefreshKey((prev) => prev + 1);
    };
    i18n.on("languageChanged", handleLanguageChange);
    return () => i18n.off("languageChanged", handleLanguageChange);
  }, [i18n]);

  // Get initial tab from route params
  useEffect(() => {
    if (params?.initialTab) {
      setActiveTab(params.initialTab as string);
    }
  }, [params.initialTab]);

  // Load userId from AsyncStorage
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

  // Since we're now using local storage only, skip API calls
  const userData = null;
  const isLoading = false;
  const error = null;
  const familyMembersData = [];
  const selectedPersonData = null;
  const isLoadingSelectedPerson = false;
  const selectedPersonError = null;

  // Handle family member not found error - reset to user
  useEffect(() => {
    if (
      selectedPersonError &&
      selectedPersonError.message?.includes("Family member not found")
    ) {
      console.log("Selected family member not found, switching to user");
      setSelectedPersonId("user");
      AsyncStorage.setItem("selectedPersonId", "user");
    }
  }, [selectedPersonError]);

  // Validate selected person when family members data changes
  useEffect(() => {
    if (Array.isArray(familyMembersData) && selectedPersonId !== "user") {
      const familyMemberExists = familyMembersData.some(
        (member: any) => member.id.toString() === selectedPersonId,
      );
      if (!familyMemberExists) {
        console.log(
          "Selected family member no longer exists, switching to user",
        );
        setSelectedPersonId("user");
        AsyncStorage.setItem("selectedPersonId", "user");
      }
    }
  }, [familyMembersData, selectedPersonId]);

  // Mutations
  const markCompletedMutation = useMutation({
    mutationFn: async (screening: any) => {
      const now = new Date();
      const nextDue = new Date();
      nextDue.setFullYear(
        nextDue.getFullYear() + (screening.screening?.frequencyYears || 1),
      );
      if (selectedPersonId !== "user") {
        return apiRequest(
          "POST",
          `/api/family/${selectedPersonId}/screenings/${screening.screeningId}/complete`,
          {
            lastCompleted: now.toISOString(),
            nextDue: nextDue.toISOString(),
            status: "completed",
          },
        );
      } else {
        return apiRequest("PUT", `/api/user-screenings/${screening.id}`, {
          lastCompleted: now.toISOString(),
          nextDue: nextDue.toISOString(),
          status: "completed",
        });
      }
    },
    onSuccess: async (data, screening) => {
      queryClient.invalidateQueries();
      showToast({
        title: isRTL ? "تم تحديث الفحص" : "Screening Updated",
        type: "success",
      });
    },
    onError: (error: any) => {
      showToast({
        title: isRTL ? "خطأ" : "Error",
        description: error.message || (isRTL ? "حدث خطأ" : "An error occurred"),
        type: "error",
      });
    },
  });

  const handleMarkCompleted = (screening: ScreeningWithDetails) => {
    markCompletedMutation.mutate(screening);
  };

  const handleScheduleScreening = async (screening: ScreeningWithDetails) => {
    const sehhatyAppStoreUrl =
      "https://apps.apple.com/sa/app/%D8%B5%D8%AD%D8%AA%D9%8A-sehhaty/id1459266578?l";
    try {
      const supported = await Linking.canOpenURL(sehhatyAppStoreUrl);
      if (supported) {
        await Linking.openURL(sehhatyAppStoreUrl);
      } else {
        showToast({
          title: isRTL ? "خطأ" : "Error",
          description: isRTL
            ? "لا يمكن فتح رابط التطبيق"
            : "Cannot open app link",
          type: "error",
        });
      }
    } catch (error) {
      showToast({
        title: isRTL ? "خطأ" : "Error",
        description: isRTL
          ? "حدث خطأ أثناء فتح التطبيق"
          : "An error occurred while opening the app",
        type: "error",
      });
    }
  };

  // Data normalization
  let familyMembers: any[] = Array.isArray(familyMembersData)
    ? familyMembersData
    : [];
  let currentPerson: { name?: string; dateOfBirth: string; gender: string } = {
    dateOfBirth: "",
    gender: "",
  };
  let screenings: ScreeningWithDetails[] = [];

  if (
    selectedPersonData &&
    typeof selectedPersonData === "object" &&
    selectedPersonData !== null
  ) {
    if (
      selectedPersonId === "user" &&
      "user" in selectedPersonData &&
      "screenings" in selectedPersonData
    ) {
      const userResponse = selectedPersonData as UserDataResponse;
      currentPerson = userResponse.user;
      screenings = userResponse.screenings;
    } else if (
      "familyMember" in selectedPersonData &&
      "screenings" in selectedPersonData
    ) {
      const familyResponse = selectedPersonData as FamilyMemberResponse;
      currentPerson = {
        name: familyResponse.familyMember.name,
        dateOfBirth: familyResponse.familyMember.dateOfBirth,
        gender: familyResponse.familyMember.gender,
      };
      screenings = familyResponse.screenings;
    }
  }

  const currentPersonAge = currentPerson.dateOfBirth
    ? calculateAge(currentPerson.dateOfBirth)
    : "";
  const currentPersonName = currentPerson.name || t("common.you");
  const currentPersonGender = currentPerson.gender || "";
  const stats = calculateScreeningStats(screenings);

  // Tabs logic
  const tabOptions = [
    { key: "all", label: t("home.tabs.all"), color: undefined },
    { key: "due", label: t("home.tabs.due"), color: STATUS_COLORS.due },
    {
      key: "overdue",
      label: t("home.tabs.overdue"),
      color: STATUS_COLORS.overdue,
    },
    { key: "later", label: t("home.tabs.later"), color: STATUS_COLORS.later },
    //{ key: 'completed', label: t('home.tabs.done'), color: STATUS_COLORS.completed },
  ];

  let filteredScreenings = screenings;
  if (activeTab === "all") {
    // Only filter out completed screenings that are not repeatable
    filteredScreenings = screenings.filter((s) => {
      // Keep the screening if it's not completed
      if (s.status !== "completed") return true;
      // For completed screenings, only keep them if they are repeatable and have a next due date
      return s.screening.frequencyYears > 0 && s.nextDue;
    });
    filteredScreenings = sortScreenings(filteredScreenings);
  } else if (activeTab !== "all") {
    filteredScreenings = filterScreeningsByStatus(screenings, activeTab);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  // Loading and error states
  if (!userId || isLoading || isLoadingSelectedPerson) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CCCE6" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  // For now, show empty screenings list since we're using local storage
  currentPerson = {
    dateOfBirth: "2000-01-01",
    gender: "male",
    name: currentPersonName,
  };
  screenings = [];

  return (
    <ScrollView
      key={refreshKey}
      style={{ flex: 1, backgroundColor: "#202221" }}
      // style={{ flex: 1, backgroundColor: 'green' }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#4CCCE6"]} // Android
          tintColor="#4CCCE6" // iOS
          title={t("common.refreshing")} // iOS
          titleColor="#4CCCE6" // iOS
        />
      }
    >
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#202221", "#272A29"]
            : ["#003848", "#4CCCE6"]
        }
        style={[
          styles.header,
          { paddingTop: insets.top + 16, paddingBottom: 16 },
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <View>
            <Text style={[styles.headerTitle, { textAlign: "left" }]}>
              {selectedPersonId === "user"
                ? t("home.hello", { name: currentPersonName })
                : t("home.screeningsFor", { name: currentPersonName })}
            </Text>
            <Text style={[styles.headerSubtitle, { textAlign: "left" }]}>
              {`${t("profile.age")}: ${currentPersonAge} • ${
                currentPersonGender === "male"
                  ? t("common.male")
                  : t("common.female")
              }`}
            </Text>
          </View>
        </View>
        {/* Family selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.familySelector}
          contentContainerStyle={{
            gap: 8,
            paddingHorizontal: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={[
              styles.familyButton,
              selectedPersonId === "user" && styles.familyButtonSelected,
            ]}
            onPress={() => setSelectedPersonId("user")}
          >
            <Text
              style={[
                styles.familyButtonText,
                selectedPersonId === "user" && styles.familyButtonSelectedText,
              ]}
            >
              {t("common.you")}
            </Text>
          </TouchableOpacity>
          {familyMembers.map((member: any) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.familyButton,
                selectedPersonId === member.id.toString() &&
                  styles.familyButtonSelected,
              ]}
              onPress={() => setSelectedPersonId(member.id.toString())}
            >
              <Text
                style={[
                  styles.familyButtonText,
                  selectedPersonId === member.id.toString() &&
                    styles.familyButtonSelectedText,
                ]}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsRow]}>
        {tabOptions.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key &&
                tab.color && {
                  backgroundColor: tab.color.background,
                  borderColor: tab.color.border,
                  borderWidth: 1,
                },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key &&
                  tab.color && { color: tab.color.text, fontWeight: "bold" },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Screenings List */}
      <View
        style={{
          padding: 16,
        }}
      >
        <ScrollView
          style={styles.screeningsList}
          contentContainerStyle={{ gap: 7, paddingBottom: 32 }}
        >
          {filteredScreenings.length === 0 ? (
            <Text style={styles.emptyText}>{t("home.noScreenings")}</Text>
          ) : (
            filteredScreenings.map((screening, index) => (
              <ScreeningCard
                key={
                  screening.id !== 0
                    ? screening.id
                    : `${screening.screening.name}-${index}`
                }
                screening={screening}
                onSchedule={() => handleScheduleScreening(screening)}
                onMarkCompleted={() => handleMarkCompleted(screening)}
                isRTL={true}
                userBirthDate={currentPerson.dateOfBirth}
              />
            ))
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = {
  centered: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#202221",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#045468",
    fontFamily: "ReadexPro",
  },
  header: {
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden" as const,
    minHeight: 160,
    alignItems: "flex-start" as const,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold" as const,
    marginBottom: 2,
    fontFamily: "ReadexPro-Bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 20,
    fontFamily: "ReadexPro",
    color: "#FFFFFF",
  },
  screeningCard: {
    backgroundColor: "#2E3130",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    elevation: 2,
  },
  screeningTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#fff",
    marginBottom: 4,
    fontFamily: "ReadexPro-Bold",
  },
  screeningStatus: { fontSize: 14, color: "#fff", fontFamily: "ReadexPro" },
  actionButton: {
    backgroundColor: "#045468",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold" as const,
    fontFamily: "ReadexPro-Bold",
  },
  familySelector: {
    marginTop: 8,
    marginBottom: 8,
  },
  familyButton: {
    backgroundColor: "#2E3130",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#045468",
  },
  familyButtonSelected: {
    backgroundColor: "#045468",
    borderColor: "#045468",
  },
  familyButtonText: {
    color: "#fff",
    fontWeight: "bold" as const,
    fontFamily: "ReadexPro-Bold",
  },
  tabsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: "#2E3130",
  },
  tabButtonText: {
    color: "#ECEDEE",
    fontFamily: "ReadexPro",
    fontSize: 14,
  },
  screeningsList: {
    flex: 1,
  },
  emptyText: {
    color: "#ECEDEE",
    textAlign: "center" as const,
    fontFamily: "ReadexPro",
    marginTop: 16,
  },
};

