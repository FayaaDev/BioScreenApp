import AsyncStorage from '@react-native-async-storage/async-storage';

interface FamilyMember {
  id: number;
  name: string;
}

/**
 * Validates if a selectedPersonId is valid based on the available family members
 * @param selectedPersonId - The ID to validate ("user" or a family member ID)
 * @param familyMembers - Array of family members
 * @returns true if valid, false otherwise
 */
export const isValidSelectedPersonId = (
  selectedPersonId: string,
  familyMembers: FamilyMember[]
): boolean => {
  if (selectedPersonId === "user") {
    return true;
  }
  
  if (!Array.isArray(familyMembers)) {
    return false;
  }
  
  return familyMembers.some(member => member.id.toString() === selectedPersonId);
};

/**
 * Safely sets the selected person ID, falling back to "user" if invalid
 * @param selectedPersonId - The ID to set
 * @param familyMembers - Array of family members to validate against
 * @param setSelectedPersonId - Function to set the selected person ID
 */
export const safeSetSelectedPersonId = async (
  selectedPersonId: string,
  familyMembers: FamilyMember[],
  setSelectedPersonId: (id: string) => void
): Promise<void> => {
  if (isValidSelectedPersonId(selectedPersonId, familyMembers)) {
    setSelectedPersonId(selectedPersonId);
    await AsyncStorage.setItem('selectedPersonId', selectedPersonId);
  } else {
    console.log(`Invalid selectedPersonId: ${selectedPersonId}, falling back to "user"`);
    setSelectedPersonId("user");
    await AsyncStorage.setItem('selectedPersonId', "user");
  }
};

/**
 * Loads and validates the selected person ID from AsyncStorage
 * @param familyMembers - Array of family members to validate against
 * @param setSelectedPersonId - Function to set the selected person ID
 */
export const loadAndValidateSelectedPersonId = async (
  familyMembers: FamilyMember[],
  setSelectedPersonId: (id: string) => void
): Promise<void> => {
  try {
    const savedSelectedPerson = await AsyncStorage.getItem('selectedPersonId');
    if (savedSelectedPerson) {
      await safeSetSelectedPersonId(savedSelectedPerson, familyMembers, setSelectedPersonId);
    }
  } catch (error) {
    console.error('Failed to load selectedPersonId:', error);
    setSelectedPersonId("user");
  }
};
