/**
 * Zimam Engine Types
 * Based on Zimam Engine Example 1 & 2 data structures
 */

// Input Profile Types
export interface BirthDate {
  day: string;
  month: string;
  year: string;
}

export interface ZimamProfileData {
  gender: 'male' | 'female';
  birthDate: BirthDate;
  height: string; // in cm
  weight: string; // in kg
  conditions: string[];
  age: number;
  bmi: number;
}

export interface ZimamProfile {
  version: string;
  data: ZimamProfileData;
}

// Output Types
export interface BilingualText {
  en: string;
  ar: string;
}

export interface Articulation {
  text: BilingualText;
  intervalNote: BilingualText | string;
}

export interface Recommendation {
  key: string;
  name: BilingualText;
  category: 'screening' | 'counseling' | 'vaccination';
  articulation: Articulation;
}

export interface RecCategory {
  key: 'screening' | 'counseling' | 'vaccination';
  name: BilingualText;
  recs: Recommendation[];
}

export interface GroupedRecs {
  groupedRecs: RecCategory[];
}

// Rule Types for defining recommendation eligibility
export type ConditionType = 
  | 'physical-inactivity'
  | 'smoking'
  | 'overweight'
  | 'obesity'
  | 'hypertension'
  | 'diabetes-mellitus'
  | 'cholesterol'
  | 'sexual-history';

export interface AgeRange {
  min?: number;
  max?: number;
}

export interface RecommendationRule {
  key: string;
  name: BilingualText;
  category: 'screening' | 'counseling' | 'vaccination';
  // Eligibility criteria
  gender?: 'male' | 'female' | 'all';
  ageRange?: AgeRange;
  requiredConditions?: ConditionType[]; // ANY of these conditions
  requiresAllConditions?: ConditionType[]; // ALL of these conditions
  excludeConditions?: ConditionType[]; // NONE of these conditions
  // Articulation templates
  articulation: {
    template: BilingualText;
    intervalNote?: BilingualText;
  };
}
