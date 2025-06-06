import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Edit, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateAge } from "@/lib/date-utils";

interface FamilyMember {
  id: number;
  userId: number;
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
}

interface FamilyManagementProps {
  userId: number;
}

export function FamilyManagement({ userId }: FamilyManagementProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    gender: "",
    dateOfBirth: ""
  });

  const { data: familyMembers, isLoading } = useQuery<FamilyMember[]>({
    queryKey: [`/api/users/${userId}/family`],
    enabled: !!userId,
  });

  const createFamilyMemberMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", `/api/users/${userId}/family`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/family`] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: t("family.memberAdded"),
        description: t("family.memberAddedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("family.addError"),
        variant: "destructive",
      });
    },
  });

  const updateFamilyMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/family/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/family`] });
      setEditingMember(null);
      resetForm();
      toast({
        title: t("family.memberUpdated"),
        description: t("family.memberUpdatedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("family.updateError"),
        variant: "destructive",
      });
    },
  });

  const deleteFamilyMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/family/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/family`] });
      toast({
        title: t("family.memberDeleted"),
        description: t("family.memberDeletedDesc"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("family.deleteError"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      relationship: "",
      gender: "",
      dateOfBirth: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship || !formData.gender || !formData.dateOfBirth) {
      toast({
        title: t("common.error"),
        description: t("family.fillAllFields"),
        variant: "destructive",
      });
      return;
    }

    if (editingMember) {
      updateFamilyMemberMutation.mutate({ id: editingMember.id, data: formData });
    } else {
      createFamilyMemberMutation.mutate(formData);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relationship: member.relationship,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(t("family.confirmDelete"))) {
      deleteFamilyMemberMutation.mutate(id);
    }
  };

  const relationshipOptions = [
    { value: "father", label: t("family.father") },
    { value: "mother", label: t("family.mother") },
    { value: "spouse", label: t("family.spouse") },
    { value: "child", label: t("family.child") },
    { value: "sibling", label: t("family.sibling") },
    { value: "other", label: t("family.other") }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-700">{t("common.loading")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
            <Users className="w-5 h-5" />
            {t("family.title")}
          </CardTitle>
          <Dialog open={isAddDialogOpen || !!editingMember} onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              setEditingMember(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="text-white hover:opacity-90"
                style={{backgroundColor: '#008553'}}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("family.addMember")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-gray-700">
                  {editingMember ? t("family.editMember") : t("family.addMember")}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-700">
                    {t("family.name")}
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("family.namePlaceholder")}
                    required
                  />
                </div>

                <div>
                  <Label className="text-gray-700">
                    {t("family.relationship")}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {relationshipOptions.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={formData.relationship === option.value ? "default" : "outline"}
                        className="h-10"
                        onClick={() => setFormData({ ...formData, relationship: option.value })}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700">
                    {t("profile.gender")}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
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
                </div>

                <div>
                  <Label htmlFor="dateOfBirth" className="text-gray-700">
                    {t("profile.dateOfBirth")}
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingMember(null);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createFamilyMemberMutation.isPending || updateFamilyMemberMutation.isPending}
                    className="flex-1 text-white hover:opacity-90"
                    style={{backgroundColor: '#008553'}}
                  >
                    {(createFamilyMemberMutation.isPending || updateFamilyMemberMutation.isPending) 
                      ? t("common.loading") 
                      : editingMember 
                        ? t("common.save") 
                        : t("family.add")
                    }
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!familyMembers || familyMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-700" />
            <p className="text-gray-700 mb-4">{t("family.noMembers")}</p>
            <p className="text-sm text-gray-700">{t("family.noMembersDesc")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-700">
                    {relationshipOptions.find(r => r.value === member.relationship)?.label || member.relationship}
                  </p>
                  <p className="text-sm text-gray-600">
                    {member.gender === 'male' ? t("common.male") : t("common.female")} • {t("profile.age")} {calculateAge(member.dateOfBirth)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(member)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
