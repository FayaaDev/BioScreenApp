/**
 * Zimam Engine Utility Functions
 * Profile computation and condition mapping
 */

import { BirthDate, ConditionType, ZimamProfile, ZimamProfileData } from './types';
import { MedicalProfile } from '../medical-storage';

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: BirthDate): number {
  const today = new Date();
  const birth = new Date(
    parseInt(birthDate.year),
    parseInt(birthDate.month) - 1, // Months are 0-indexed
    parseInt(birthDate.day)
  );
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  console.log(`[Zimam Utils] Age calculation: birthDate=${JSON.stringify(birthDate)}, birth=${birth.toISOString()}, today=${today.toISOString()}, age=${age}`);
  
  return Math.max(0, age); // Ensure non-negative age
}

/**
 * Calculate BMI from height (cm) and weight (kg)
 */
export function calculateBMI(heightCm: string, weightKg: string): number {
  const height = parseFloat(heightCm);
  const weight = parseFloat(weightKg);
  
  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
    return 0;
  }
  
  // BMI = weight (kg) / height (m)²
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
}

/**
 * Parse date string (YYYY-MM-DD or similar) to BirthDate object
 */
export function parseDateString(dateStr: string): BirthDate {
  const date = new Date(dateStr);
  return {
    day: date.getDate().toString(),
    month: (date.getMonth() + 1).toString(),
    year: date.getFullYear().toString(),
  };
}

/**
 * Convert MedicalProfile to Zimam conditions array
 */
export function profileToConditions(
  profile: MedicalProfile,
  bmi: number
): ConditionType[] {
  const conditions: ConditionType[] = [];

  // Physical inactivity - assume inactive if not explicitly tracked
  // For now, we'll add it as a default risk factor
  conditions.push('physical-inactivity');

  // Smoking
  if (profile.isSmoker) {
    conditions.push('smoking');
  }

  // Weight-based conditions
  if (bmi >= 30) {
    conditions.push('obesity');
    conditions.push('overweight'); // Obesity implies overweight
  } else if (bmi >= 25) {
    conditions.push('overweight');
  }

  // Medical conditions
  if (profile.isHypertensive) {
    conditions.push('hypertension');
  }

  if (profile.isDiabetic) {
    conditions.push('diabetes-mellitus');
  }

  if (profile.isCholesterol) {
    conditions.push('cholesterol');
  }

  // Sexual history
  if (profile.isSexuallyActive) {
    conditions.push('sexual-history');
  }

  // Pregnancy
  if (profile.isPregnant) {
    conditions.push('pregnant');
  }

  return conditions;
}

/**
 * Convert MedicalProfile to ZimamProfile format
 */
export function medicalProfileToZimam(profile: MedicalProfile): ZimamProfile {
  console.log('[Zimam Utils] Converting profile:', JSON.stringify(profile, null, 2));
  
  // Handle missing or invalid dateOfBirth
  if (!profile.dateOfBirth) {
    console.warn('[Zimam Utils] Missing dateOfBirth, using default');
  }
  
  const birthDate = parseDateString(profile.dateOfBirth || '1990-01-01');
  const age = calculateAge(birthDate);
  const bmi = calculateBMI(profile.height || '170', profile.weight || '70');
  const conditions = profileToConditions(profile, bmi);

  console.log('[Zimam Utils] Calculated - Age:', age, 'BMI:', bmi, 'Conditions:', conditions);

  const data: ZimamProfileData = {
    gender: (profile.gender?.toLowerCase() || 'male') as 'male' | 'female',
    birthDate,
    height: profile.height || '170',
    weight: profile.weight || '70',
    conditions,
    age,
    bmi,
  };

  return {
    version: 'v1',
    data,
  };
}
