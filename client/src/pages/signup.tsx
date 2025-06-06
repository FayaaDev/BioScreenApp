import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Users } from "lucide-react";
import logoPath from "@assets/30520EE1-3193-4D73-AB12-A1A18B3392F3-removebg-preview.png";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");

  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; gender: string; dateOfBirth: string }) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: (user) => {
      // Store user ID in localStorage for this demo
      localStorage.setItem('healthscreen_user_id', user.id.toString());
      setLocation("/");
      toast({
        title: t("onboarding.welcomeTitle"),
        description: t("onboarding.welcomeDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("onboarding.createError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!name || !email || !password || !confirmPassword || !selectedGender || !dateOfBirth) {
      toast({
        title: t("onboarding.missingInfo"),
        description: t("onboarding.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({ name, email, password, gender: selectedGender, dateOfBirth });
  };

  const isFormValid = name && email && password && confirmPassword && selectedGender && dateOfBirth;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 pt-12 pb-8 text-white" style={{background: 'linear-gradient(to right, #008553, #006b44)'}}>
        <div className="text-center">
          <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <img 
              src={logoPath} 
              alt="App Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("onboarding.title")}</h1>
          <p className="text-green-100 text-sm">{t("onboarding.subtitle")}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">{t("onboarding.welcomeTitle")}</h2>
            <p className="text-sm leading-relaxed text-gray-700">{t("onboarding.welcomeDesc")}</p>
          </div>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-2 block text-gray-700">
                  {t("onboarding.fullName")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 text-black"
                  placeholder={t("onboarding.fullNamePlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-2 block text-gray-700">
                  {t("onboarding.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-black"
                  placeholder={t("onboarding.emailPlaceholder")}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium mb-2 block text-gray-700">
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-black"
                  placeholder="أدخل كلمة المرور"
                  dir="ltr"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block text-gray-700">
                  تأكيد كلمة المرور
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 text-black"
                  placeholder="أعد إدخال كلمة المرور"
                  dir="ltr"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block text-gray-700">
                  {t("onboarding.gender")}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={selectedGender === "male" ? "default" : "outline"}
                    className={`h-12 flex items-center justify-center gap-2 ${
                      selectedGender === "male" 
                        ? "text-white hover:opacity-90" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    style={selectedGender === "male" ? {backgroundColor: '#008553'} : {}}
                    onClick={() => {
                      console.log("Male button clicked");
                      setSelectedGender("male");
                    }}
                  >
                    <User className="w-4 h-4" />
                    {t("common.male")}
                  </Button>
                  <Button
                    type="button"
                    variant={selectedGender === "female" ? "default" : "outline"}
                    className={`h-12 flex items-center justify-center gap-2 ${
                      selectedGender === "female" 
                        ? "text-white hover:opacity-90" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    style={selectedGender === "female" ? {backgroundColor: '#008553'} : {}}
                    onClick={() => {
                      console.log("Female button clicked");
                      setSelectedGender("female");
                    }}
                  >
                    <Users className="w-4 h-4" />
                    {t("common.female")}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="dateOfBirth" className="text-sm font-medium mb-2 block text-gray-700">
                  {t("onboarding.dateOfBirth")}
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="h-12 text-black"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || createUserMutation.isPending}
                className="w-full h-12 text-white font-medium hover:opacity-90 mb-4"
                style={{backgroundColor: '#008553'}}
              >
                {createUserMutation.isPending ? t("onboarding.creating") : t("onboarding.getStarted")}
              </Button>

              {/* User Agreement Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-gray-200 text-gray-700"
                  >
                    {t("onboarding.userAgreement")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-gray-700">{t("onboarding.userAgreementTitle")}</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 w-full rounded-md border p-4 text-gray-700" dir="rtl">
                    <div className="text-sm leading-relaxed space-y-4">
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

              {/* Login Button for existing users */}
              <div className="mt-6 text-center">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                  className="text-gray-700"
                >
                  لديك حساب بالفعل؟ تسجيل الدخول
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
