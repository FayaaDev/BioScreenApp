/**
 * Zimam Recommendation Engine
 * Generates health recommendations based on user profile using Zimam engine rules
 */

import { MedicalProfile } from './medical-storage';
import {
  medicalProfileToZimam,
  evaluateRecommendations,
  GroupedRecs,
  ZimamProfile,
} from './zimam';

export interface EngineInput {
  profile: MedicalProfile;
  // Add other inputs as needed (e.g. current date, location)
}

// Re-export Zimam types for external use
export type { GroupedRecs, ZimamProfile };
export { Recommendation, RecCategory, BilingualText, Articulation } from './zimam';

export interface EngineOutput {
  groupedRecs: GroupedRecs;
  zimamProfile: ZimamProfile;
}

/**
 * Zimam Recommendation Engine
 * Evaluates user profile and returns grouped recommendations
 */
export const RecommendationEngine = {
  /**
   * Generate recommendations based on user profile
   */
  evaluate: async (input: EngineInput): Promise<EngineOutput> => {
    console.log('[Zimam Engine] Evaluating profile:', input.profile);

    // Convert MedicalProfile to ZimamProfile format
    const zimamProfile = medicalProfileToZimam(input.profile);
    console.log('[Zimam Engine] Converted to ZimamProfile:', zimamProfile);

    // Evaluate recommendations using Zimam engine
    const groupedRecs = evaluateRecommendations(zimamProfile);
    console.log('[Zimam Engine] Generated recommendations:', groupedRecs);

    return {
      groupedRecs,
      zimamProfile,
    };
  },
};
