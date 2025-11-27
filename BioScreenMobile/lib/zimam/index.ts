/**
 * Zimam Engine - Public API
 * @zimam/zimam local implementation
 */

// Types
export {
  ZimamProfile,
  ZimamProfileData,
  BirthDate,
  BilingualText,
  Articulation,
  Recommendation,
  RecCategory,
  GroupedRecs,
  ConditionType,
  RecommendationRule,
  AgeRange,
} from './types';

// Utils
export {
  calculateAge,
  calculateBMI,
  parseDateString,
  profileToConditions,
  medicalProfileToZimam,
} from './utils';

// Processor
export { evaluateRecommendations } from './processor';

// Data (for reference/testing)
export { screeningRules } from './data/screenings';
export { counselingRules } from './data/counselings';
export { vaccinationRules } from './data/vaccinations';
