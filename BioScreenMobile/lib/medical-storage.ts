import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MedicalProfile {
  dateOfBirth: string;
  gender: string;
  isDiabetic: boolean;
  isHypertensive: boolean;
  isCholesterol: boolean;
  isSmoker: boolean;
  smokingDetails?: {
    amount: string;
    duration: string;
  };
  height: string;
  weight: string;
  isPregnant?: boolean;
  isSexuallyActive: boolean;
  sexualActivityDetails?: {
    partnerCount: 'single' | 'multiple';
  };
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember extends MedicalProfile {
  id: string;
  userId: string;
  relationship: string;
  medicalConditions?: string[];
}

// Helper functions using AsyncStorage
const getUserProfile = async (userId: string): Promise<MedicalProfile | null> => {
  const data = await AsyncStorage.getItem(`user_profile_${userId}`);
  return data ? JSON.parse(data) : null;
};

const getFamilyMembers = async (userId: string): Promise<FamilyMember[]> => {
  const data = await AsyncStorage.getItem(`family_members_${userId}`);
  return data ? JSON.parse(data) : [];
};

const getAllTestKeys = async (userId: string): Promise<string[]> => {
  const data = await AsyncStorage.getItem(`tests_list_${userId}`);
  return data ? JSON.parse(data) : [];
};

export const medicalStorage = {
  // User Profile
  saveUserProfile: async (userId: string, profile: Omit<MedicalProfile, 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const existingProfile = await getUserProfile(userId);
    
    const fullProfile: MedicalProfile = {
      ...profile,
      createdAt: existingProfile?.createdAt || now,
      updatedAt: now,
    };
    
    await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(fullProfile));
  },

  getUserProfile,

  // Family Members
  saveFamilyMember: async (userId: string, member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<FamilyMember> => {
    const now = new Date().toISOString();
    const memberId = `${userId}_${Date.now()}`;
    
    const fullMember: FamilyMember = {
      ...member,
      id: memberId,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const members = await getFamilyMembers(userId);
    members.push(fullMember);
    
    await AsyncStorage.setItem(`family_members_${userId}`, JSON.stringify(members));
    return fullMember;
  },

  updateFamilyMember: async (userId: string, memberId: string, updates: Partial<Omit<FamilyMember, 'id' | 'userId' | 'createdAt'>>) => {
    const members = await getFamilyMembers(userId);
    const index = members.findIndex(m => m.id === memberId);
    
    if (index !== -1) {
      members[index] = {
        ...members[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(`family_members_${userId}`, JSON.stringify(members));
    }
  },

  deleteFamilyMember: async (userId: string, memberId: string) => {
    const members = await getFamilyMembers(userId);
    const filtered = members.filter(m => m.id !== memberId);
    
    await AsyncStorage.setItem(`family_members_${userId}`, JSON.stringify(filtered));
  },

  getFamilyMembers,

  // Test Results
  saveTestResult: async (userId: string, testData: any) => {
    const key = `test_${userId}_${Date.now()}`;
    await AsyncStorage.setItem(key, JSON.stringify(testData));
    
    const testsList = await getAllTestKeys(userId);
    testsList.push(key);
    await AsyncStorage.setItem(`tests_list_${userId}`, JSON.stringify(testsList));
  },

  getAllTestKeys,

  getTestResults: async (userId: string) => {
    const keys = await getAllTestKeys(userId);
    const results = await Promise.all(
      keys.map(async key => {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      })
    );
    return results.filter(Boolean);
  },

  // Onboarding
  setOnboardingComplete: async (userId: string, complete: boolean) => {
    await AsyncStorage.setItem(`onboarding_completed_${userId}`, complete.toString());
  },

  isOnboardingComplete: async (userId: string): Promise<boolean> => {
    const value = await AsyncStorage.getItem(`onboarding_completed_${userId}`);
    return value === 'true';
  },

  // Clear all data for a user
  clearUserData: async (userId: string) => {
    await AsyncStorage.removeItem(`user_profile_${userId}`);
    await AsyncStorage.removeItem(`family_members_${userId}`);
    await AsyncStorage.removeItem(`tests_list_${userId}`);
    await AsyncStorage.removeItem(`onboarding_completed_${userId}`);
    
    const testKeys = await getAllTestKeys(userId);
    await Promise.all(testKeys.map(key => AsyncStorage.removeItem(key)));
  },

  // Clear all data
  clearAllData: async () => {
    await AsyncStorage.clear();
  },
};
