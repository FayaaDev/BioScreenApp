import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import logoPath from "@assets/30520EE1-3193-4D73-AB12-A1A18B3392F3-removebg-preview.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً ${data.user.name}`,
      });
      
      // Set localStorage for consistency with other authentication checks
      localStorage.setItem('healthscreen_user_id', data.user.id.toString());
      
      // Invalidate auth cache to refresh user state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Redirect based on user role
      if (data.user.isAdmin) {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{backgroundColor: '#f8fffe'}}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoPath} alt="شعار التطبيق" className="w-16 h-16" />
          </div>
          <CardTitle className="text-2xl" style={{color: '#008553'}}>
            تسجيل الدخول
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="أدخل البريد الإلكتروني"
                required
                className="text-black"
                dir="ltr"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-gray-700">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="أدخل كلمة المرور"
                required
                className="text-black"
                dir="ltr"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              style={{backgroundColor: '#008553'}}
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/onboarding")}
              className="text-gray-700"
            >
              التسجيل
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}