import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Settings, Clock, Users } from "lucide-react";
import logoPath from "@assets/30520EE1-3193-4D73-AB12-A1A18B3392F3-removebg-preview.png";
import { ScreeningCard } from "@/components/screening-card";
import { BottomNav } from "@/components/bottom-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { calculateAge } from "@/lib/date-utils";
import { calculateScreeningStats, filterScreeningsByStatus } from "@/lib/screening-utils";
import type { ScreeningWithDetails } from "@/lib/screening-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UserDataResponse {
  user: {
    name?: string;
    dateOfBirth: string;
    gender: string;
    // Add other user properties as needed
  };
  screenings: ScreeningWithDetails[];
}

interface FamilyMemberResponse {
  familyMember: FamilyMember;
  screenings: ScreeningWithDetails[];
}

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
  gender: "male" | "female";
  dateOfBirth: string;
}

export default function UpcomingTests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPersonId, setSelectedPersonId] = useState<string>("user");
 const isRTL = i18n.language === 'ar';
 
   useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRTL, i18n.language]);

  useEffect(() => {
    const storedUserId = localStorage.getItem('healthscreen_user_id');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    } else {
      setLocation("/onboarding");
    }
  }, [setLocation]);

  // Load selected person from localStorage
  useEffect(() => {
    const savedSelectedPerson = localStorage.getItem('selectedPersonId');
    if (savedSelectedPerson) {
      setSelectedPersonId(savedSelectedPerson);
    }
  }, []);

  // Save selected person to localStorage
  useEffect(() => {
    localStorage.setItem('selectedPersonId', selectedPersonId);
  }, [selectedPersonId]);

  const { data: userData, isLoading, error } = useQuery<UserDataResponse>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: familyMembersData, error: familyError, isLoading: isFamilyLoading } = useQuery<FamilyMember[]>({
    queryKey: [`/api/users/${userId}/family`],
    enabled: !!userId,
  });

  // Debug the family members query
  console.log("Family query - isLoading:", isFamilyLoading, "error:", familyError, "data:", familyMembersData);

  const { data: selectedPersonData, isLoading: isLoadingSelectedPerson } = useQuery({
    queryKey: selectedPersonId === "user" 
      ? [`/api/users/${userId}`] 
      : [`/api/family/${selectedPersonId}/screenings`],
    enabled: !!userId && (selectedPersonId === "user" || selectedPersonId !== "user"),
  });

  const handleScheduleScreening = (screening: ScreeningWithDetails) => {
    toast({
      title: "Appointment Scheduling",
      description: `Redirecting to schedule ${screening.screening.name}...`,
    });
  };

  const markCompletedMutation = useMutation({
    mutationFn: async (screening: ScreeningWithDetails) => {
      const now = new Date();
      const nextDue = new Date();
      nextDue.setFullYear(nextDue.getFullYear() + screening.screening.frequencyYears);

      if (selectedPersonId !== "user") {
        // For family members, use a different endpoint
        const response = await apiRequest("POST", `/api/family/${selectedPersonId}/screenings/${screening.screeningId}/complete`, {
          lastCompleted: now.toISOString(),
          nextDue: nextDue.toISOString(),
          status: "completed"
        });
        return response.json();
      } else {
        // For user's own screenings
        const response = await apiRequest("PUT", `/api/user-screenings/${screening.id}`, {
          lastCompleted: now.toISOString(),
          nextDue: nextDue.toISOString(),
          status: "completed"
        });
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidate queries for both user and family data
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      if (selectedPersonId !== "user") {
        queryClient.invalidateQueries({ queryKey: [`/api/family/${selectedPersonId}/screenings`] });
      }
      toast({
        title: t("home.screeningCompleted"),
        description: t("home.screeningCompletedDesc"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("home.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleMarkCompleted = (screening: ScreeningWithDetails) => {
    markCompletedMutation.mutate(screening);
  };

  if (!userId) {
    return null; // Will redirect to onboarding
  }

  if (isLoading) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={logoPath} alt="App Logo" className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">{t("home.loadingPlan")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Clear invalid user data and redirect to onboarding
    localStorage.removeItem('healthscreen_user_id');
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <img src={logoPath} alt="App Logo" className="w-12 h-12 mx-auto mb-4" style={{filter: 'grayscale(100%)'}} />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("home.sessionExpired")}</h2>
          <p className="text-gray-600 mb-6">{t("home.sessionExpiredDesc")}</p>
          <Button 
            onClick={() => {
              localStorage.removeItem('healthscreen_user_id');
              setLocation("/onboarding");
            }}
            className="text-white hover:opacity-90"
            style={{backgroundColor: '#008553'}}
          >
            {t("home.createNewProfile")}
          </Button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  // Get current person data (either user or selected family member)
  const familyMembers = familyMembersData || [];
  
  // Debug logging
  console.log("Family members data:", familyMembersData);
  console.log("Family members array:", familyMembers);
  console.log("Selected person ID:", selectedPersonId);
  
  if (!selectedPersonData) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={logoPath} alt="App Logo" className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">{t("home.loadingPlan")}</p>
        </div>
      </div>
    );
  }

  // Handle different response structures for user vs family member
  let currentPerson: { name?: string; dateOfBirth: string; gender: string };
  let screenings: ScreeningWithDetails[];
  
  if (selectedPersonId === "user") {
    // User data structure
    const userResponse = selectedPersonData as UserDataResponse;
    currentPerson = userResponse.user;
    screenings = userResponse.screenings;
  } else {
    // Family member data structure
    const familyResponse = selectedPersonData as FamilyMemberResponse;
    currentPerson = {
      name: familyResponse.familyMember.name,
      dateOfBirth: familyResponse.familyMember.dateOfBirth,
      gender: familyResponse.familyMember.gender,
    };
    screenings = familyResponse.screenings;
  }

  const selectedFamilyMember = selectedPersonId !== "user" 
    ? familyMembers.find(member => member.id.toString() === selectedPersonId)
    : null;
  
  const currentPersonAge = calculateAge(selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth);
  const currentPersonName = selectedFamilyMember?.name || userData.user.name || t("common.you");
  const currentPersonGender = selectedFamilyMember?.gender || currentPerson.gender;
  
  const stats = calculateScreeningStats(screenings);

  // Helper function to get time-based personalized greeting
  const getPersonalizedGreeting = (name?: string) => {
    const hour = new Date().getHours();
    let greetingKey: string;
    
    if (hour < 12) {
      greetingKey = 'morningGreeting';
    } else if (hour < 18) {
      greetingKey = 'afternoonGreeting';
    } else {
      greetingKey = 'eveningGreeting';
    }
    
    if (name && name !== t("common.you")) {
      return t(`home.${greetingKey}`, { name });
    }
    return t("home.greetingDefault");
  };

  // Filter screenings to only show the most recent incomplete (not 'completed') screening for each screeningId
  const uniqueIncompleteScreeningsMap = new Map();
  screenings.forEach((screening) => {
    if (screening.status !== 'completed') {
      // If there are multiple, keep the one with the latest nextDue
      const existing = uniqueIncompleteScreeningsMap.get(screening.screeningId);
      if (!existing || new Date(screening.nextDue) > new Date(existing.nextDue)) {
        uniqueIncompleteScreeningsMap.set(screening.screeningId, screening);
      }
    }
  });
  const uniqueIncompleteScreenings = Array.from(uniqueIncompleteScreeningsMap.values());

  // Filter screenings based on active tab
  let filteredScreenings;
  if (activeTab === "all") {
    // Show only non-completed, unique screenings in "all" tab (upcoming tab)
    filteredScreenings = uniqueIncompleteScreenings;
  } else {
    filteredScreenings = filterScreeningsByStatus(uniqueIncompleteScreenings, activeTab);
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white pb-20" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-white p-4" style={{background: 'linear-gradient(to right, #008553, #006b44)'}}>
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className={`flex-1 ${i18n.language === 'ar' ? 'text-right mr-3' : 'text-left ml-3'}`}>
              <h1 className="text-lg font-semibold text-white">
                {selectedPersonId === "user" ? getPersonalizedGreeting(currentPersonName) : `${t("home.screeningsFor")} ${currentPersonName}`}
              </h1>
              
              {/* Family Member Selector integrated in header */}
              <div className="mt-2">
                <Select value={selectedPersonId} onValueChange={setSelectedPersonId}>
                  <SelectTrigger className="bg-white/20 border-white/30 text-white placeholder:text-white/70 w-full">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <SelectValue placeholder={t("family.selectPerson")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      {t("family.yourself")}
                    </SelectItem>
                    {familyMembers.length > 0 ? (
                      familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({t(`family.relationships.${member.relationship}`)})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-family" disabled>
                        {t("family.noMembers")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <p className="text-sm text-green-100 mt-1">
                {t("common.age")} {currentPersonAge} • {t(`common.${currentPersonGender}`)}
              </p>
            </div>
            <div className="w-8"></div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.due}</div>
            <div className="text-xs text-gray-700">{t("home.due")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <div className="text-xs text-gray-700">{t("home.overdue")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.later}</div>
            <div className="text-xs text-gray-700">{t("home.later")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-gray-700">{t("home.completed")}</div>
          </div>
        </div>
      </div>
      {/* Screening Tabs */}
      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs" style={{color: '#9b945d'}} >{t("home.tabs.all")}</TabsTrigger>
            <TabsTrigger value="due" className="text-xs" style={{color: '#9b945d'}} >{t("home.tabs.due")}</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs" style={{color: '#9b945d'}} >{t("home.tabs.overdue")}</TabsTrigger>
            <TabsTrigger value="later" className="text-xs" style={{color: '#9b945d'}} >{t("home.tabs.later")}</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs" style={{color: '#9b945d'}} >{t("home.tabs.done")}</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            {filteredScreenings.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700">{t("home.noScreenings")}</p>
                </CardContent>
              </Card>
            ) : (
              filteredScreenings.map((screening: any) => (
                <ScreeningCard
                  key={screening.id}
                  screening={screening}
                  onSchedule={() => handleScheduleScreening(screening)}
                  onMarkCompleted={() => handleMarkCompleted(screening)}
                  isRTL={isRTL}
                  userBirthDate={selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="due" className="mt-4 space-y-3">
            {filterScreeningsByStatus(filteredScreenings, "due").length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700">{t("home.noDue")}</p>
                </CardContent>
              </Card>
            ) : (
              filterScreeningsByStatus(filteredScreenings, "due").map((screening) => (
                <ScreeningCard
                  key={screening.id}
                  screening={screening}
                  onSchedule={() => handleScheduleScreening(screening)}
                  onMarkCompleted={() => handleMarkCompleted(screening)}
                  isRTL={isRTL}
                  userBirthDate={selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="overdue" className="mt-4 space-y-3">
            {filterScreeningsByStatus(filteredScreenings, "overdue").length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700">{t("home.noOverdue")}</p>
                </CardContent>
              </Card>
            ) : (
              filterScreeningsByStatus(filteredScreenings, "overdue").map((screening) => (
                <ScreeningCard
                  key={screening.id}
                  screening={screening}
                  onSchedule={() => handleScheduleScreening(screening)}
                  onMarkCompleted={() => handleMarkCompleted(screening)}
                  isRTL={isRTL}
                  userBirthDate={selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="later" className="mt-4 space-y-3">
            {filterScreeningsByStatus(filteredScreenings, "later").length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700">{t("home.noLater")}</p>
                </CardContent>
              </Card>
            ) : (
              filterScreeningsByStatus(filteredScreenings, "later").map((screening) => (
                <ScreeningCard
                  key={screening.id}
                  screening={screening}
                  onSchedule={() => handleScheduleScreening(screening)}
                  onMarkCompleted={() => handleMarkCompleted(screening)}
                  isRTL={isRTL}
                  userBirthDate={selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4 space-y-3">
            {filterScreeningsByStatus(filteredScreenings, "completed").length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-700">{t("home.noCompleted")}</p>
                </CardContent>
              </Card>
            ) : (
              filterScreeningsByStatus(filteredScreenings, "completed").map((screening) => (
                <ScreeningCard
                  key={screening.id}
                  screening={screening}
                  onSchedule={() => handleScheduleScreening(screening)}
                  onMarkCompleted={() => handleMarkCompleted(screening)}
                  isRTL={isRTL}
                  userBirthDate={selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
}