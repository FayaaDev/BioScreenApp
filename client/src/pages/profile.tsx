import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, User, Users, Edit, Save, X } from "lucide-react";
import logoPath from "@assets/30520EE1-3193-4D73-AB12-A1A18B3392F3-removebg-preview.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BottomNav } from "@/components/bottom-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { calculateAge } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { FamilyManagement } from "@/components/family-management";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    gender: ""
  });

  useEffect(() => {
    const storedUserId = localStorage.getItem('healthscreen_user_id');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    } else {
      setLocation("/onboarding");
    }
  }, [setLocation]);

  const { data: userData, isLoading, error } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  useEffect(() => {
    if (userData && typeof userData === 'object' && 'user' in userData) {
      const user = (userData as any).user;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        dateOfBirth: user.dateOfBirth,
        gender: user.gender
      });
    }
  }, [userData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; dateOfBirth: string; gender: string }) => {
      const response = await apiRequest("PATCH", `/api/users/${userId}`, data);
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (userData && typeof userData === 'object' && 'user' in userData) {
      const user = (userData as any).user;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        dateOfBirth: user.dateOfBirth,
        gender: user.gender
      });
    }
    setIsEditing(false);
  };

  if (!userId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={logoPath} alt="شعار التطبيق" className="w-12 h-12 animate-pulse mx-auto mb-4" />
          <p className="text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    localStorage.removeItem('healthscreen_user_id');
    return (
      <div className="min-h-screen max-w-md mx-auto bg-white flex items-center justify-center">
        <div className="text-center px-6">
          <img src={logoPath} alt="App Logo" className="w-12 h-12 mx-auto mb-4" style={{filter: 'grayscale(100%)'}} />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t("profile.sessionExpired")}</h2>
          <p className="text-gray-600 mb-6">{t("profile.sessionExpiredDesc")}</p>
          <Button 
            onClick={() => {
              localStorage.removeItem('healthscreen_user_id');
              setLocation("/onboarding");
            }}
            className="text-white hover:opacity-90"
            style={{backgroundColor: '#008553'}}
          >
            {t("profile.createNewProfile")}
          </Button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const { user } = userData as any;
  const userAge = calculateAge(user.dateOfBirth);

  return (
    <div className="min-h-screen max-w-md mx-auto bg-white pb-20" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-white p-4" style={{background: 'linear-gradient(to right, #008553, #006b44)'}}>
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div className={`flex-1 ${i18n.language === 'ar' ? 'text-right mr-3' : 'text-left ml-3'}`}>
            <h1 className="text-lg font-semibold">{t("profile.title")}</h1>
            <p className="text-green-100 text-sm">
              {t("profile.manageInfo")}
            </p>
          </div>
          
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 py-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-gray-700">{t("profile.personalInfo")}</CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {t("profile.editProfile")}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 text-white hover:opacity-90 bg-primary"
                  >
                    <Save className="w-4 h-4" />
                    {updateProfileMutation.isPending ? t("common.loading") : t("common.save")}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                {t("profile.name")}
              </Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-gray-900">{formData.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t("profile.email")}
              </Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-black">{formData.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                {t("profile.dateOfBirth")}
              </Label>
              {isEditing ? (
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="mt-1"
                  max={new Date().toISOString().split('T')[0]}
                />
              ) : (
                <p className="mt-1 text-black">
                  {new Date(formData.dateOfBirth).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} (<span className="text-gray-700">{t("profile.age")} {userAge}</span>)
                </p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                {t("profile.gender")}
              </Label>
              {isEditing ? (
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={formData.gender === "male" ? "default" : "outline"}
                    className="h-10 flex items-center justify-center gap-2"
                    onClick={() => setFormData({ ...formData, gender: "male" })}
                  >
                    <User className="w-4 h-4" />
                    {t("common.male")}
                  </Button>
                  <Button
                    type="button"
                    variant={formData.gender === "female" ? "default" : "outline"}
                    className="h-10 flex items-center justify-center gap-2"
                    onClick={() => setFormData({ ...formData, gender: "female" })}
                  >
                    <Users className="w-4 h-4" />
                    {t("common.female")}
                  </Button>
                </div>
              ) : (
                <p className="mt-1 capitalize text-black">
                  {formData.gender === 'male' ? t("common.male") : t("common.female")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Family Management */}
        <FamilyManagement userId={userId} />

        {/* Language Settings */}
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-gray-700">{t("profile.languageSettings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{t("profile.currentLanguage")}</p>
                <p className="text-xs text-gray-700">{t("language.current")}</p>
              </div>
              {/* <LanguageSwitcher /> */}
            </div>
            
            {/* Reset Profile Button */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Button
                variant="destructive"
                className="w-full border-gray-200 text-gray-700"
                onClick={() => {
                  localStorage.removeItem('healthscreen_user_id');
                  toast({
                    title: t("profile.profileReset"),
                    description: t("profile.profileResetDesc"),
                  });
                  setLocation("/onboarding");
                }}
              >
                {t("profile.resetProfile")}
              </Button>

              {/* Signout Button */}
              <Button
                variant="outline"
                className="w-full flex items-center gap-2 border-2 border-gray-200 text-gray-700"
                onClick={() => logout()}
              >
                تسجيل الخروج
              </Button>

              {/* User Agreement Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 border-2 border-gray-200 text-gray-700"
                  >
                    {t("onboarding.userAgreement")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-gray-700">{t("onboarding.userAgreementTitle")}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 w-full rounded-md border p-4" dir="rtl">
                    <div className="text-sm leading-relaxed space-y-4 text-gray-700">
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.intro.title")}</h3>
                        <p>{t("onboarding.agreement.intro.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.appNature.title")}</h3>
                        <p>{t("onboarding.agreement.appNature.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.recommendations.title")}</h3>
                        <p>{t("onboarding.agreement.recommendations.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.disclaimer.title")}</h3>
                        <p>{t("onboarding.agreement.disclaimer.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.intellectualProperty.title")}</h3>
                        <p>{t("onboarding.agreement.intellectualProperty.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.acceptableUse.title")}</h3>
                        <p>{t("onboarding.agreement.acceptableUse.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.termination.title")}</h3>
                        <p>{t("onboarding.agreement.termination.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.applicableLaw.title")}</h3>
                        <p>{t("onboarding.agreement.applicableLaw.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.changes.title")}</h3>
                        <p>{t("onboarding.agreement.changes.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.contact.title")}</h3>
                        <p>{t("onboarding.agreement.contact.content")}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold mb-2 text-black">{t("onboarding.agreement.consent.title")}</h3>
                        <p>{t("onboarding.agreement.consent.content")}</p>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}