/**
 * Zimam Engine Processor
 * Main recommendation evaluation logic
 */

import {
  ZimamProfile,
  ZimamProfileData,
  RecommendationRule,
  GroupedRecs,
  RecCategory,
  Recommendation,
  ConditionType,
} from './types';
import { screeningRules } from './data/screenings';
import { counselingRules } from './data/counselings';
import { vaccinationRules } from './data/vaccinations';

/**
 * Check if profile meets age requirements
 */
function meetsAgeRequirement(age: number, rule: RecommendationRule): boolean {
  if (!rule.ageRange) return true;

  const { min, max } = rule.ageRange;

  if (min !== undefined && age < min) return false;
  if (max !== undefined && age > max) return false;

  return true;
}

/**
 * Check if profile meets gender requirements
 */
function meetsGenderRequirement(
  gender: 'male' | 'female',
  rule: RecommendationRule
): boolean {
  if (!rule.gender || rule.gender === 'all') return true;
  return rule.gender === gender;
}

/**
 * Check if profile has ANY of the required conditions
 */
function hasAnyCondition(
  profileConditions: string[],
  requiredConditions?: ConditionType[]
): boolean {
  if (!requiredConditions || requiredConditions.length === 0) return true;
  return requiredConditions.some((condition) =>
    profileConditions.includes(condition)
  );
}

/**
 * Check if profile has ALL of the required conditions
 */
function hasAllConditions(
  profileConditions: string[],
  requiredConditions?: ConditionType[]
): boolean {
  if (!requiredConditions || requiredConditions.length === 0) return true;
  return requiredConditions.every((condition) =>
    profileConditions.includes(condition)
  );
}

/**
 * Check if profile has NONE of the excluded conditions
 */
function hasNoExcludedConditions(
  profileConditions: string[],
  excludeConditions?: ConditionType[]
): boolean {
  if (!excludeConditions || excludeConditions.length === 0) return true;
  return !excludeConditions.some((condition) =>
    profileConditions.includes(condition)
  );
}

/**
 * Check if a rule applies to the given profile
 */
function ruleApplies(
  profile: ZimamProfileData,
  rule: RecommendationRule
): boolean {
  // Check gender
  if (!meetsGenderRequirement(profile.gender, rule)) {
    return false;
  }

  // Check age
  if (!meetsAgeRequirement(profile.age, rule)) {
    return false;
  }

  // Check required conditions (ANY)
  if (!hasAnyCondition(profile.conditions, rule.requiredConditions)) {
    return false;
  }

  // Check required conditions (ALL)
  if (!hasAllConditions(profile.conditions, rule.requiresAllConditions)) {
    return false;
  }

  // Check excluded conditions
  if (!hasNoExcludedConditions(profile.conditions, rule.excludeConditions)) {
    return false;
  }

  return true;
}

/**
 * Convert a rule to a recommendation output
 */
function ruleToRecommendation(rule: RecommendationRule): Recommendation {
  return {
    key: rule.key,
    name: rule.name,
    category: rule.category,
    articulation: {
      text: rule.articulation.template,
      intervalNote: rule.articulation.intervalNote || '',
    },
  };
}

/**
 * Filter rules and return applicable recommendations
 */
function filterRules(
  profile: ZimamProfileData,
  rules: RecommendationRule[],
  categoryName: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const addedKeys = new Set<string>();

  console.log(`[Zimam] Filtering ${categoryName} rules for profile:`, {
    gender: profile.gender,
    age: profile.age,
    conditions: profile.conditions,
  });

  for (const rule of rules) {
    const applies = ruleApplies(profile, rule);
    console.log(`[Zimam] Rule "${rule.key}" applies: ${applies}`);
    
    if (applies) {
      // Use base key for deduplication (e.g., "blood-pressure-screening" from "blood-pressure-screening-40plus")
      const baseKey = rule.key.replace(/-\d+plus$/, '').replace(/-smoker$/, '').replace(/-diabetes$/, '').replace(/-obesity$/, '');
      
      if (!addedKeys.has(baseKey)) {
        recommendations.push(ruleToRecommendation(rule));
        addedKeys.add(baseKey);
        console.log(`[Zimam] Added recommendation: ${rule.name.en}`);
      }
    }
  }

  console.log(`[Zimam] Total ${categoryName}: ${recommendations.length}`);
  return recommendations;
}

/**
 * Main entry point: Evaluate recommendations for a profile
 */
export function evaluateRecommendations(profile: ZimamProfile): GroupedRecs {
  const { data } = profile;

  console.log('[Zimam] Starting evaluation for profile:', data);

  // Filter each category
  const screenings = filterRules(data, screeningRules, 'screenings');
  const counselings = filterRules(data, counselingRules, 'counselings');
  const vaccinations = filterRules(data, vaccinationRules, 'vaccinations');

  // Build grouped recommendations
  const groupedRecs: RecCategory[] = [];

  if (screenings.length > 0) {
    groupedRecs.push({
      key: 'screening',
      name: {
        en: 'Screenings',
        ar: 'الفحوصات',
      },
      recs: screenings,
    });
  }

  if (counselings.length > 0) {
    groupedRecs.push({
      key: 'counseling',
      name: {
        en: 'Counselings',
        ar: 'المشورات',
      },
      recs: counselings,
    });
  }

  if (vaccinations.length > 0) {
    groupedRecs.push({
      key: 'vaccination',
      name: {
        en: 'Vaccinations',
        ar: 'التطعيمات',
      },
      recs: vaccinations,
    });
  }

  return { groupedRecs };
}
