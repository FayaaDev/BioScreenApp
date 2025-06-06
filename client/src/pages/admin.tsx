import { useState } from "react";
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
import { ArrowLeft, Plus, Edit, Trash2, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Screening, InsertScreening } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
  });
  const [selectedIcon, setSelectedIcon] = useState<File | null>(null);
  const [isRepeating, setIsRepeating] = useState(true);
  const { t } = useTranslation();

  const { data: screenings = [], isLoading: screeningsLoading } = useQuery<Screening[]>({
    queryKey: ["/api/screenings"],
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
      title: "فحوصات الرجال",
      value: screenings.filter((s: Screening) => s.genderApplicable === "male").length,
      icon: "👨",
    },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
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

        {/* Add New Screening */}
        <div className="mb-8">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full md:w-auto"
                style={{backgroundColor: '#008553'}}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة فحص طبي جديد
              </Button>
            </DialogTrigger>
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
                        <SelectItem value="men">صحة الرجل</SelectItem>
                        <SelectItem value="women"> صحة المرأة</SelectItem>
                        <SelectItem value="general">فحوصات عامة</SelectItem>
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
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="genderApplicable">الجنس</Label>
                    <Select 
                      value={newScreening.genderApplicable} 
                      onValueChange={(value) => setNewScreening({...newScreening, genderApplicable: value as "male" | "female" | "both"})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">كلا الجنسين</SelectItem>
                        <SelectItem value="male">الرجال فقط</SelectItem>
                        <SelectItem value="female">النساء فقط</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="startAge">العمر الابتدائي للفحص</Label>
                    <Input
                      id="startAge"
                      type="number"
                      value={newScreening.startAge}
                      onChange={(e) => setNewScreening({...newScreening, startAge: parseInt(e.target.value)})}
                      min="0"
                      max="120"
                    />
                  </div>

                  <div>
                    <Label htmlFor="endAge">العمر النهائي للفحص</Label>
                    <Input
                      id="endAge"
                      type="number"
                      value={newScreening.endAge || ""}
                      onChange={(e) => setNewScreening({...newScreening, endAge: e.target.value ? parseInt(e.target.value) : null})}
                      min="0"
                      max="120"
                      placeholder="اختياري"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id="repeating"
                        checked={isRepeating}
                        onCheckedChange={(checked) => setIsRepeating(checked as boolean)}
                      />
                      <Label htmlFor="repeating">فحص متكرر</Label>
                    </div>
                    {isRepeating && (
                      <div>
                        <Label htmlFor="frequencyYears">تكرار الفحص (بالسنوات)</Label>
                        <Input
                          id="frequencyYears"
                          type="number"
                          value={newScreening.frequencyYears}
                          onChange={(e) => setNewScreening({...newScreening, frequencyYears: parseInt(e.target.value)})}
                          min="1"
                          max="10"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority">مستوى الأولوية</Label>
                    <Select 
                      value={newScreening.priority} 
                      onValueChange={(value) => setNewScreening({...newScreening, priority: value as "strongly_recommended" | "recommended" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strongly_recommended">موصى به بشدة</SelectItem>
                        <SelectItem value="recommended">موصى به</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="icon">رمز الفحص</Label>
                  <Input
                    id="icon"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  {selectedIcon && (
                    <p className="text-sm text-green-600 mt-1">
                      تم اختيار: {selectedIcon.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createScreeningMutation.isPending}
                    style={{backgroundColor: '#008553'}}
                  >
                    {createScreeningMutation.isPending ? "جاري الإضافة..." : "إضافة الفحص"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Screenings List */}
        <div>
          <h3 className="text-lg font-semibold mb-4">الفحوصات الحالية</h3>
          
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{screening.name}</h4>
                        <Badge variant={screening.isActive ? "default" : "secondary"}>
                          {screening.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant={
                          screening.priority === "strongly_recommended" ? "destructive" :
                          screening.priority === "recommended" ? "default" : "secondary"
                        }>
                          {screening.priority === "strongly_recommended" ? "موصى به بشدة" :
                           screening.priority === "recommended" ? "موصى به" : "اختياري"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{screening.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>الفئة: {screening.category}</span>
                        <span>الجنس: {screening.genderApplicable}</span>
                        <span>العمر: {screening.startAge}{screening.endAge ? `-${screening.endAge}` : '+'}</span>
                        <span>التكرار: كل {screening.frequencyYears} سنة</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
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
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}