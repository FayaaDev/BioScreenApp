import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, ArrowLeft, CheckCircle, Users } from "lucide-react";
import { ScreeningCard } from "@/components/screening-card";
import { BottomNav } from "@/components/bottom-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import logoPath from "@assets/30520EE1-3193-4D73-AB12-A1A18B3392F3-removebg-preview.png";
import { calculateAge } from "@/lib/date-utils";
import { filterScreeningsByStatus } from "@/lib/screening-utils";
import type { ScreeningWithDetails } from "@/lib/screening-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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


export default function CompletedTests() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [userId, setUserId] = useState<number | null>(null);
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

  const { data: familyMembersData } = useQuery<FamilyMember[]>({
    queryKey: [`/api/users/${userId}/family`],
    enabled: !!userId,
  });

  const { data: selectedPersonData, isLoading: isLoadingSelectedPerson } = useQuery({
    queryKey: selectedPersonId === "user" 
      ? [`/api/users/${userId}`] 
      : [`/api/family/${selectedPersonId}/screenings`],
    enabled: !!userId && (selectedPersonId === "user" || selectedPersonId !== "user"),
  });

  const handleScheduleScreening = (screening: ScreeningWithDetails) => {
    toast({
      title: t("completed.appointmentScheduling"),
      description: t("completed.redirectingToSchedule", { name: screening.screening.name }),
    });
  };

  const uncompleteMutation = useMutation({
    mutationFn: async (screening: ScreeningWithDetails) => {
      if (selectedPersonId !== "user") {
        // For family members, use the new uncomplete endpoint
        if (screening.id === 0) {
          throw new Error(t("completed.cannotUncompleteFamilyMember"));
        }
        const response = await apiRequest("PATCH", `/api/family/${selectedPersonId}/screenings/${screening.screeningId}/uncomplete`, {});
        return response.json();
      } else {
        // For user's own screenings
        const nextDue = new Date();
        nextDue.setFullYear(nextDue.getFullYear() + screening.screening.frequencyYears);
        const response = await apiRequest("PUT", `/api/user-screenings/${screening.id}`, {
          status: "upcoming",
          lastCompleted: null,
          nextDue: nextDue.toISOString()
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
        title: t("completed.statusUpdated"),
        description: t("completed.movedToUpcoming"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("completed.updateError"),
        variant: "destructive",
      });
    },
  });

  const handleMarkCompleted = (screening: ScreeningWithDetails) => {
    uncompleteMutation.mutate(screening);
  };

  if (!userId) {
    return null;
  }

  if (isLoading || isLoadingSelectedPerson) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={logoPath} alt="App Logo" className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">{t("completed.loadingCompleted")}</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("completed.sessionExpired")}</h2>
          <p className="text-gray-600 mb-6">{t("completed.sessionExpiredDesc")}</p>
          <Button 
            onClick={() => {
              localStorage.removeItem('healthscreen_user_id');
              setLocation("/onboarding");
            }}
            className="text-white hover:opacity-90"
            style={{backgroundColor: '#008553'}}
          >
            {t("completed.createNewProfile")}
          </Button>
        </div>
      </div>
    );
  }

  if (!userData || !selectedPersonData) {
    return null;
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

  const familyMembers = familyMembersData || [];
  const selectedFamilyMember = selectedPersonId !== "user" 
    ? familyMembers.find(member => member.id.toString() === selectedPersonId)
    : null;
  
  const currentPersonAge = calculateAge(selectedFamilyMember?.dateOfBirth || currentPerson.dateOfBirth);
  const currentPersonName = selectedFamilyMember?.name || userData.user.name || t("common.you");
  const currentPersonGender = selectedFamilyMember?.gender || currentPerson.gender;

  const userAge = calculateAge(currentPerson.dateOfBirth);
  const completedScreenings = filterScreeningsByStatus(screenings, "completed");

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white pb-20" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-white p-4" style={{background: 'linear-gradient(to right, #008553, #006B43)'}}>
        <div className="w-full">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className={`flex-1 ${i18n.language === 'ar' ? 'text-right mr-3' : 'text-left ml-3'}`}>
              <h1 className="text-lg font-semibold text-white">
                {selectedPersonId === "user" ? t("completed.title") : `${t("completed.completedFor")} ${currentPersonName}`}
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

      {/* Completed Screenings */}
      <div className="px-4 py-4">
        <div className="mb-4">
          <h2 className="text-sm font-medium mb-2 text-gray-700">
            {t("completed.completedCount", { count: completedScreenings.length })}
          </h2>
        </div>

        <div className="space-y-3">
          {completedScreenings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-3 text-gray-700">
                  <img src={logoPath} alt="App Logo" className="w-12 h-12 mx-auto" />
                </div>
                <p className="mb-2 text-gray-700">{t("completed.noCompleted")}</p>
                <p className="text-sm text-gray-700">
                  {t("completed.noCompletedDescription")}
                </p>
                <Button 
                  onClick={() => setLocation("/")}
                  className="mt-4 text-white hover:opacity-90"
                  style={{backgroundColor: '#008553'}}
                >
                  {t("completed.viewAvailable")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            completedScreenings.map((screening) => (
              <ScreeningCard
                key={screening.id}
                screening={screening}
                onSchedule={() => handleScheduleScreening(screening)}
                onMarkCompleted={() => handleMarkCompleted(screening)}
                isRTL={isRTL}
                userBirthDate={currentPerson.dateOfBirth}
              />
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}