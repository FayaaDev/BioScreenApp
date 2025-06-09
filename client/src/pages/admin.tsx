import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Shield, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Screening, InsertScreening, EducationalContent, InsertEducationalContent } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface AdminUser {
  id: number;
  username: string;
  lastLogin: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditScreeningDialogOpen, setIsEditScreeningDialogOpen] = useState(false);
  const [editingScreening, setEditingScreening] = useState<Screening | null>(null);
  const [newScreening, setNewScreening] = useState<InsertScreening>({
    name: "",
    description: "",
    category: "",
    genderApplicable: "both",
    startAge: 18,
    endAge: null,
    frequencyYears: 1,
    iconUrl: null,
    priority: "recommended",
    specialCode: "",
  });
  const [selectedIcon, setSelectedIcon] = useState<File | null>(null);
  const [editSelectedIcon, setEditSelectedIcon] = useState<File | null>(null);
  const [isRepeating, setIsRepeating] = useState(true);
  const [editIsRepeating, setEditIsRepeating] = useState(true);
  const [activeTab, setActiveTab] = useState("screenings");
  
  // Educational content states
  const [isAddEducationalDialogOpen, setIsAddEducationalDialogOpen] = useState(false);
  const [isEditEducationalDialogOpen, setIsEditEducationalDialogOpen] = useState(false);
  const [editingEducationalContent, setEditingEducationalContent] = useState<EducationalContent | null>(null);
  const [newEducationalContent, setNewEducationalContent] = useState<InsertEducationalContent>({
    title: "",
    content: "",
    category: "",
    isActive: true,
  });
  
  const { t } = useTranslation();

  const { data: screenings = [], isLoading: screeningsLoading } = useQuery<Screening[]>({
    queryKey: ["/api/screenings"],
  });

  const { data: educationalContent = [], isLoading: educationalContentLoading } = useQuery<EducationalContent[]>({
    queryKey: ["/api/admin/educational-content"],
    enabled: isAuthenticated,
  });

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('adminToken');
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        localStorage.removeItem('adminToken');
      })
      .finally(() => {
        setIsLoadingAuth(false);
      });
    } else {
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('adminToken', data.token);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في لوحة الإدارة",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد",
        variant: "destructive",
      });
    },
  });

  const createScreeningMutation = useMutation({
    mutationFn: async (screening: InsertScreening) => {
      let screeningData = { ...screening };
      
      // Set frequency to 0 if not repeating
      if (!isRepeating) {
        screeningData.frequencyYears = 0;
      }
      
      // Handle icon upload if a file is selected
      if (selectedIcon) {
        const formData = new FormData();
        formData.append('icon', selectedIcon);
        
        const uploadResponse = await fetch('/api/upload-icon', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload icon');
        }
        
        const uploadResult = await uploadResponse.json();
        screeningData.iconUrl = uploadResult.iconUrl;
      }
      
      return await apiRequest("POST", "/api/screenings", screeningData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      setIsAddDialogOpen(false);
      setNewScreening({
        name: "",
        description: "",
        category: "",
        genderApplicable: "both",
        startAge: 18,
        endAge: null,
        frequencyYears: 1,
        iconUrl: null,
        priority: "recommended",
        specialCode: "",
      });
      setSelectedIcon(null);
      setIsRepeating(true);
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة الفحص الطبي الجديد",
      });
    },
    onError: (error) => {
      console.error("Error creating screening:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الفحص الطبي",
        variant: "destructive",
      });
    },
  });

  const deleteScreeningMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/screenings/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الفحص الطبي",
      });
    },
    onError: (error) => {
      console.error("Error deleting screening:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الفحص الطبي",
        variant: "destructive",
      });
    },
  });

  const updateScreeningMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertScreening> }) => {
      return await apiRequest("PUT", `/api/screenings/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      setIsEditScreeningDialogOpen(false);
      setEditingScreening(null);
      setEditSelectedIcon(null);
      setEditIsRepeating(true);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث الفحص الطبي",
      });
    },
    onError: (error) => {
      console.error("Error updating screening:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث الفحص الطبي",
        variant: "destructive",
      });
    },
  });

  // Educational content mutations
  const createEducationalContentMutation = useMutation({
    mutationFn: async (content: InsertEducationalContent) => {
      return await apiRequest("POST", "/api/admin/educational-content", content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/educational-content"] });
      setIsAddEducationalDialogOpen(false);
      setNewEducationalContent({
        title: "",
        content: "",
        category: "",
        isActive: true,
      });
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة المحتوى التعليمي الجديد",
      });
    },
    onError: (error) => {
      console.error("Error creating educational content:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المحتوى التعليمي",
        variant: "destructive",
      });
    },
  });

  const updateEducationalContentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertEducationalContent> }) => {
      return await apiRequest("PUT", `/api/admin/educational-content/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/educational-content"] });
      setIsEditEducationalDialogOpen(false);
      setEditingEducationalContent(null);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المحتوى التعليمي",
      });
    },
    onError: (error) => {
      console.error("Error updating educational content:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث المحتوى التعليمي",
        variant: "destructive",
      });
    },
  });

  const deleteEducationalContentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/admin/educational-content/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/educational-content"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المحتوى التعليمي",
      });
    },
    onError: (error) => {
      console.error("Error deleting educational content:", error);
      toast({
        title: "خطأ",
        description: "فشل في حذف المحتوى التعليمي",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    setLocation('/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة صالح",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedIcon(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newScreening.name.trim() || !newScreening.description.trim() || !newScreening.category.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    createScreeningMutation.mutate(newScreening);
  };

  // Educational content handlers
  const handleEducationalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEducationalContent.title.trim() || !newEducationalContent.content.trim() || !newEducationalContent.category.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    createEducationalContentMutation.mutate(newEducationalContent);
  };

  const handleEditEducational = (content: EducationalContent) => {
    setEditingEducationalContent(content);
    setIsEditEducationalDialogOpen(true);
  };

  const handleUpdateEducational = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEducationalContent) return;
    
    updateEducationalContentMutation.mutate({
      id: editingEducationalContent.id,
      updates: {
        title: editingEducationalContent.title,
        content: editingEducationalContent.content,
        category: editingEducationalContent.category,
        isActive: editingEducationalContent.isActive,
      }
    });
  };

  const handleEditScreening = (screening: Screening) => {
    setEditingScreening(screening);
    setEditIsRepeating(screening.frequencyYears > 0);
    setIsEditScreeningDialogOpen(true);
  };

  const handleUpdateScreening = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingScreening) return;
    
    if (!editingScreening.name || !editingScreening.description || !editingScreening.category) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    let updatedScreening = { ...editingScreening };
    
    // Set frequency to 0 if not repeating
    if (!editIsRepeating) {
      updatedScreening.frequencyYears = 0;
    }
    
    // Handle icon upload if a new file is selected
    if (editSelectedIcon) {
      try {
        const formData = new FormData();
        formData.append('icon', editSelectedIcon);
        
        const uploadResponse = await fetch('/api/upload-icon', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload icon');
        }
        
        const uploadResult = await uploadResponse.json();
        updatedScreening.iconUrl = uploadResult.iconUrl;
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في رفع الأيقونة",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Remove the id field for the update
    const { id, ...updates } = updatedScreening;
    
    updateScreeningMutation.mutate({
      id: editingScreening.id,
      updates
    });
  };

  const statsData = screenings && screenings.length > 0 ? [
    {
      title: "إجمالي الفحوصات",
      value: screenings.length,
      icon: "📊",
    },
    {
      title: "الفحوصات النشطة",
      value: screenings.filter((s: Screening) => s.isActive).length,
      icon: "✅",
    },
    {
      title: "فحوصات عالية الأولوية",
      value: screenings.filter((s: Screening) => s.priority === "strongly_recommended").length,
      icon: "🚨",
    },
    {
      title: "المحتوى التعليمي",
      value: educationalContent.length,
      icon: "📚",
    },
  ] : [];

  // Add authorization header to all API requests
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Add token to all fetch requests
      const originalFetch = window.fetch;
      window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
        if (init) {
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${token}`
          };
        } else {
          init = {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          };
        }
        return originalFetch(input, init);
      };
    }
  }, []);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-6 h-6" style={{color: '#008553'}} />
              <h2 className="text-2xl font-bold" style={{color: '#008553'}}>
                تسجيل دخول الإدارة
              </h2>
            </div>
          </div>            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <Label htmlFor="username" className="text-right block">اسم المستخدم</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1 text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label htmlFor="password" className="text-right block">كلمة المرور</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 text-right"
                    dir="rtl"
                  />
                </div>
              </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                style={{backgroundColor: '#008553'}}
              >
                {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            تسجيل الخروج
          </Button>
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 flex-row-reverse"
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة للرئيسية
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6" style={{color: '#008553'}} />
            <h1 className="text-2xl font-bold" style={{color: '#008553'}}>
              لوحة إدارة الفحوصات الطبية
            </h1>
          </div>
          <p className="text-gray-700">{t("admin.loading")}</p>
          <p className="text-sm text-gray-700">{t("admin.subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold" style={{color: '#008553'}}>
                  {stat.value}
                </div>
                <p className="text-sm" style={{color: '#9b945d'}}>
                  {stat.title}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="screenings" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                الفحوصات الطبية
              </TabsTrigger>
              <TabsTrigger value="educationalContent" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                المحتوى التعليمي
              </TabsTrigger>
            </TabsList>

            <TabsContent value="screenings">
              {/* Screenings content */}
              <div>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h3 className="text-lg font-semibold">الفحوصات الحالية</h3>
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)} 
                    style={{backgroundColor: '#008553'}}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة فحص طبي جديد
                  </Button>
                </div>
                
                {screeningsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">جاري تحميل الفحوصات...</p>
                  </div>
                ) : !screenings || screenings.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">لا توجد فحوصات طبية.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {screenings.map((screening: Screening) => (
                      <Card key={screening.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditScreening(screening)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteScreeningMutation.mutate(screening.id)}
                              disabled={deleteScreeningMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1 mr-4">
                            <div className="mb-2 text-right">
                              <h4 className="font-semibold text-right mb-2">{screening.name}</h4>
                              <div className="flex items-center gap-2 justify-end">
                                <Badge 
                                  variant={screening.isActive ? "default" : "secondary"}
                                  className={screening.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                                >
                                  {screening.isActive ? "نشط" : "غير نشط"}
                                </Badge>
                                <Badge 
                                  variant={
                                    screening.priority === "strongly_recommended" ? "destructive" :
                                    screening.priority === "recommended" ? "default" : "secondary"
                                  }
                                  className={
                                    screening.priority === "strongly_recommended" ? "bg-red-100 text-red-800 border-red-200" :
                                    screening.priority === "recommended" ? "bg-blue-100 text-blue-800 border-blue-200" : 
                                    "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  }
                                >
                                  {screening.priority === "strongly_recommended" ? "موصى به بشدة" :
                                   screening.priority === "recommended" ? "موصى به" : "اختياري"}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 text-right">{screening.description}</p>
                            <div className="flex gap-4 text-xs text-gray-500 justify-end">
                              <span>التكرار: كل {screening.frequencyYears} سنة</span>
                              <span>العمر: {screening.startAge}{screening.endAge ? `-${screening.endAge}` : '+'}</span>
                              <span>الجنس: {screening.genderApplicable}</span>
                              <span>الفئة: {screening.category}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="educationalContent">
              {/* Educational content */}
              <div>
                <div className="flex justify-between items-center mb-4 flex-row-reverse">
                  <h3 className="text-lg font-semibold">المحتوى التعليمي</h3>
                  <Button 
                    onClick={() => setIsAddEducationalDialogOpen(true)} 
                    style={{backgroundColor: '#008553'}}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة محتوى تعليمي جديد
                  </Button>
                </div>
                
                {educationalContentLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">جاري تحميل المحتوى التعليمي...</p>
                  </div>
                ) : !educationalContent || educationalContent.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">لا يوجد محتوى تعليمي.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {educationalContent.map((content) => (
                      <Card key={content.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingEducationalContent(content);
                                setIsEditEducationalDialogOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteEducationalContentMutation.mutate(content.id)}
                              disabled={deleteEducationalContentMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex-1 text-right mr-4">
                            <div className="mb-2 text-right">
                              <h4 className="font-semibold text-right mb-2">{content.title}</h4>
                              <div className="flex items-center gap-2 justify-end">
                                <Badge 
                                  variant={content.isActive ? "default" : "secondary"}
                                  className={content.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                                >
                                  {content.isActive ? "نشط" : "غير نشط"}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mb-2 text-right">{content.content}</p>
                            <div className="flex gap-4 text-xs text-gray-500 justify-end">
                              <span>الفئة: {content.category}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Dialogs */}
        <Dialog open={isAddEducationalDialogOpen} onOpenChange={setIsAddEducationalDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة محتوى تعليمي جديد</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleEducationalSubmit} className="space-y-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">العنوان *</Label>
                  <Input
                    id="title"
                    value={newEducationalContent.title}
                    onChange={(e) => setNewEducationalContent({...newEducationalContent, title: e.target.value})}
                    placeholder="مثال: أهمية فحص ضغط الدم"
                    className="text-right"
                    dir="rtl"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">الفئة *</Label>
                  <Select 
                    value={newEducationalContent.category} 
                    onValueChange={(value) => setNewEducationalContent({...newEducationalContent, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">صحة الرجل</SelectItem>
                      <SelectItem value="women"> صحة المرأة</SelectItem>
                      <SelectItem value="general">فحوصات عامة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="content">المحتوى *</Label>
                <Textarea
                  id="content"
                  value={newEducationalContent.content}
                  onChange={(e) => setNewEducationalContent({...newEducationalContent, content: e.target.value})}
                  placeholder="محتوى تعليمي مفصل حول الفحص وأهميته..."
                  rows={3}
                  className="text-right"
                  dir="rtl"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Label htmlFor="isActive">نشط</Label>
                <Checkbox 
                  id="isActive"
                  checked={newEducationalContent.isActive}
                  onCheckedChange={(checked) => setNewEducationalContent({...newEducationalContent, isActive: checked === true})}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 flex-row-reverse">
                <Button 
                  type="submit" 
                  disabled={createEducationalContentMutation.isPending}
                  style={{backgroundColor: '#008553'}}
                >
                  {createEducationalContentMutation.isPending ? "جاري الإضافة..." : "إضافة المحتوى التعليمي"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddEducationalDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditEducationalDialogOpen} onOpenChange={setIsEditEducationalDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل المحتوى التعليمي</DialogTitle>
            </DialogHeader>
            
            {editingEducationalContent && (
              <form onSubmit={handleUpdateEducational} className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">العنوان *</Label>
                    <Input
                      id="title"
                      value={editingEducationalContent.title}
                      onChange={(e) => setEditingEducationalContent({...editingEducationalContent, title: e.target.value})}
                      placeholder="مثال: أهمية فحص ضغط الدم"
                      className="text-right"
                      dir="rtl"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">الفئة *</Label>
                    <Select 
                      value={editingEducationalContent.category} 
                      onValueChange={(value) => setEditingEducationalContent({...editingEducationalContent, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="men">صحة الرجل</SelectItem>
                        <SelectItem value="women"> صحة المرأة</SelectItem>
                        <SelectItem value="general">فحوصات عامة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">المحتوى *</Label>
                  <Textarea
                    id="content"
                    value={editingEducationalContent.content}
                    onChange={(e) => setEditingEducationalContent({...editingEducationalContent, content: e.target.value})}
                    placeholder="محتوى تعليمي مفصل حول الفحص وأهميته..."
                    rows={3}
                    className="text-right"
                    dir="rtl"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Label htmlFor="isActive">نشط</Label>
                  <Checkbox 
                    id="isActive"
                    checked={editingEducationalContent.isActive}
                    onCheckedChange={(checked) => setEditingEducationalContent({...editingEducationalContent, isActive: checked === true})}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 flex-row-reverse">
                  <Button 
                    type="submit" 
                    disabled={updateEducationalContentMutation.isPending}
                    style={{backgroundColor: '#008553'}}
                  >
                    {updateEducationalContentMutation.isPending ? "جاري التعديل..." : "تحديث المحتوى التعليمي"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditEducationalDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Screening Dialog */}
        <Dialog open={isEditScreeningDialogOpen} onOpenChange={setIsEditScreeningDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل الفحص الطبي</DialogTitle>
            </DialogHeader>
            
            {editingScreening && (
              <form onSubmit={handleUpdateScreening} className="space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">اسم الفحص *</Label>
                    <Input
                      id="edit-name"
                      value={editingScreening.name}
                      onChange={(e) => setEditingScreening({...editingScreening, name: e.target.value})}
                      placeholder="مثال: فحص ضغط الدم"
                      className="text-right"
                      dir="rtl"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-category">الفئة *</Label>
                    <Select 
                      value={editingScreening.category} 
                      onValueChange={(value) => setEditingScreening({...editingScreening, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardiovascular">القلب والأوعية الدموية</SelectItem>
                        <SelectItem value="cancer screening">فحص السرطان</SelectItem>
                        <SelectItem value="bone health">صحة العظام</SelectItem>
                        <SelectItem value="vision/hearing">النظر والسمع</SelectItem>
                        <SelectItem value="vaccinations">التطعيمات</SelectItem>
                        <SelectItem value="preventive">وقائي</SelectItem>
                        <SelectItem value="general">عام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-description">الوصف *</Label>
                  <Textarea
                    id="edit-description"
                    value={editingScreening.description}
                    onChange={(e) => setEditingScreening({...editingScreening, description: e.target.value})}
                    placeholder="وصف الفحص وأهميته"
                    className="min-h-[100px] text-right"
                    dir="rtl"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-gender">الجنس المطبق عليه</Label>
                    <Select 
                      value={editingScreening.genderApplicable} 
                      onValueChange={(value: "male" | "female" | "both") => setEditingScreening({...editingScreening, genderApplicable: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">كلاهما</SelectItem>
                        <SelectItem value="male">ذكور فقط</SelectItem>
                        <SelectItem value="female">إناث فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-startAge">العمر المبدئي *</Label>
                    <Input
                      id="edit-startAge"
                      type="number"
                      value={editingScreening.startAge}
                      onChange={(e) => setEditingScreening({...editingScreening, startAge: parseInt(e.target.value)})}
                      min="0"
                      max="120"
                      className="text-right"
                      dir="rtl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-endAge">العمر النهائي (اختياري)</Label>
                    <Input
                      id="edit-endAge"
                      type="number"
                      value={editingScreening.endAge || ''}
                      onChange={(e) => setEditingScreening({...editingScreening, endAge: e.target.value ? parseInt(e.target.value) : null})}
                      min="0"
                      max="120"
                      className="text-right"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-priority">الأولوية</Label>
                    <Select 
                      value={editingScreening.priority} 
                      onValueChange={(value: "strongly_recommended" | "recommended" | "optional") => setEditingScreening({...editingScreening, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strongly_recommended">موصى به بشدة</SelectItem>
                        <SelectItem value="recommended">موصى به</SelectItem>
                        <SelectItem value="optional">اختياري</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-row-reverse">
                  <Label htmlFor="edit-repeating">هل يتكرر هذا الفحص؟</Label>
                  <Checkbox 
                    id="edit-repeating"
                    checked={editIsRepeating}
                    onCheckedChange={(checked) => setEditIsRepeating(checked === true)}
                  />
                </div>

                {editIsRepeating && (
                  <div>
                    <Label htmlFor="edit-frequency">التكرار (بالسنوات)</Label>
                    <Input
                      id="edit-frequency"
                      type="number"
                      value={editingScreening.frequencyYears}
                      onChange={(e) => setEditingScreening({...editingScreening, frequencyYears: parseInt(e.target.value)})}
                      min="1"
                      max="50"
                      className="text-right"
                      dir="rtl"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="edit-icon">أيقونة الفحص (اختياري)</Label>
                  <Input
                    id="edit-icon"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditSelectedIcon(e.target.files?.[0] || null)}
                    className="text-right"
                    dir="rtl"
                  />
                  {editingScreening.iconUrl && !editSelectedIcon && (
                    <div className="mt-2">
                      <img 
                        src={editingScreening.iconUrl} 
                        alt="Current icon" 
                        className="w-16 h-16 object-contain"
                      />
                      <p className="text-sm text-gray-500 mt-1">الأيقونة الحالية</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-specialCode">كود خاص (اختياري)</Label>
                  <Input
                    id="edit-specialCode"
                    value={editingScreening?.specialCode || ""}
                    onChange={(e) => setEditingScreening(editingScreening ? { ...editingScreening, specialCode: e.target.value } : null)}
                    placeholder="مثال: SMOKER_ONLY"
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 flex-row-reverse">
                  <Button 
                    type="submit" 
                    disabled={updateScreeningMutation.isPending}
                    style={{backgroundColor: '#008553'}}
                  >
                    {updateScreeningMutation.isPending ? "جاري التحديث..." : "تحديث الفحص"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditScreeningDialogOpen(false);
                      setEditingScreening(null);
                      setEditSelectedIcon(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Screening Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة فحص طبي جديد</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم الفحص *</Label>
                  <Input
                    id="name"
                    value={newScreening.name}
                    onChange={(e) => setNewScreening({...newScreening, name: e.target.value})}
                    placeholder="مثال: فحص ضغط الدم"
                    className="text-right"
                    dir="rtl"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">الفئة *</Label>
                  <Select 
                    value={newScreening.category} 
                    onValueChange={(value) => setNewScreening({...newScreening, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفئة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiovascular">القلب والأوعية الدموية</SelectItem>
                      <SelectItem value="cancer screening">فحص السرطان</SelectItem>
                      <SelectItem value="bone health">صحة العظام</SelectItem>
                      <SelectItem value="vision/hearing">النظر والسمع</SelectItem>
                      <SelectItem value="vaccinations">التطعيمات</SelectItem>
                      <SelectItem value="preventive">وقائي</SelectItem>
                      <SelectItem value="general">عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">الوصف *</Label>
                <Textarea
                  id="description"
                  value={newScreening.description}
                  onChange={(e) => setNewScreening({...newScreening, description: e.target.value})}
                  placeholder="وصف مفصل للفحص وأهميته..."
                  rows={3}
                  className="text-right"
                  dir="rtl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="genderApplicable">الجنس المطبق عليه</Label>
                  <Select 
                    value={newScreening.genderApplicable} 
                    onValueChange={(value: "male" | "female" | "both") => setNewScreening({...newScreening, genderApplicable: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">الجنسين</SelectItem>
                      <SelectItem value="male">الرجال فقط</SelectItem>
                      <SelectItem value="female">النساء فقط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startAge">العمر المبدئي</Label>
                  <Input
                    id="startAge"
                    type="number"
                    value={newScreening.startAge}
                    onChange={(e) => setNewScreening({...newScreening, startAge: parseInt(e.target.value) || 18})}
                    min="0"
                    max="100"
                    className="text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <Label htmlFor="endAge">العمر النهائي (اختياري)</Label>
                  <Input
                    id="endAge"
                    type="number"
                    value={newScreening.endAge || ''}
                    onChange={(e) => setNewScreening({...newScreening, endAge: e.target.value ? parseInt(e.target.value) : null})}
                    min="0"
                    max="120"
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select 
                    value={newScreening.priority} 
                    onValueChange={(value: "strongly_recommended" | "recommended" | "optional") => setNewScreening({...newScreening, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strongly_recommended">موصى به بشدة</SelectItem>
                      <SelectItem value="recommended">موصى به</SelectItem>
                      <SelectItem value="optional">اختياري</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Label htmlFor="isRepeating">فحص متكرر</Label>
                    <Checkbox 
                      id="isRepeating"
                      checked={isRepeating}
                      onCheckedChange={(checked) => setIsRepeating(checked === true)}
                    />
                  </div>
                  
                  {isRepeating && (
                    <div>
                      <Label htmlFor="frequencyYears">التكرار (بالسنوات)</Label>
                      <Input
                        id="frequencyYears"
                        type="number"
                        value={newScreening.frequencyYears}
                        onChange={(e) => setNewScreening({...newScreening, frequencyYears: parseInt(e.target.value) || 1})}
                        min="1"
                        max="10"
                        className="text-right"
                        dir="rtl"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="specialCode">كود خاص (اختياري)</Label>
                <Input
                  id="specialCode"
                  value={newScreening.specialCode}
                  onChange={(e) => setNewScreening({ ...newScreening, specialCode: e.target.value })}
                  placeholder="مثال: SMOKER_ONLY"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="icon">أيقونة الفحص (اختياري)</Label>
                <Input
                  id="icon"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {selectedIcon && (
                  <p className="text-sm text-gray-600 mt-1">
                    تم اختيار: {selectedIcon.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 flex-row-reverse">
                <Button 
                  type="submit" 
                  disabled={createScreeningMutation.isPending}
                  style={{backgroundColor: '#008553'}}
                >
                  {createScreeningMutation.isPending ? "جاري الإضافة..." : "إضافة الفحص الطبي"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}