/**
 * Configuration for the automatic vetting system
 */

export interface VettingConfig {
  // Default number of candidates to highlight for admin review
  defaultHighlightedCandidateCount: number;
  
  // Scoring weights for high-skill jobs
  highSkillWeights: {
    yearsOfExperience: number;
    skillMatching: number;
    profileCompleteness: number;
    proximity: number;
    applicationSpeed: number;
  };
  
  // Scoring weights for low-skill jobs
  lowSkillWeights: {
    applicationSpeed: number;
    profileCompleteness: number;
    experience: number;
    proximity: number;
  };
  
  // Profile completeness factors
  profileCompletenessWeights: {
    basicInfo: number; // name, email, phone
    location: number; // state, city, address
    cvDocument: number;
    profilePicture: number;
    skills: number; // at least 1 skill
    yearsOfExperience: number;
    jobTitle: number;
  };
  
  // Minimum profile completeness threshold (0-100)
  minProfileCompletenessThreshold: number;
  
  // Application speed calculation settings
  applicationSpeed: {
    maxHoursForFullScore: number; // Hours after job creation for full score
    scoreDecayPerHour: number; // Score reduction per hour
  };
}

export const VETTING_CONFIG: VettingConfig = {
  defaultHighlightedCandidateCount: 3,
  
  highSkillWeights: {
    yearsOfExperience: 0.30,
    skillMatching: 0.25,
    profileCompleteness: 0.20,
    proximity: 0.15,
    applicationSpeed: 0.10,
  },
  
  lowSkillWeights: {
    applicationSpeed: 0.40,
    profileCompleteness: 0.30,
    experience: 0.20,
    proximity: 0.10,
  },
  
  profileCompletenessWeights: {
    basicInfo: 0.20,
    location: 0.15,
    cvDocument: 0.20,
    profilePicture: 0.10,
    skills: 0.15,
    yearsOfExperience: 0.10,
    jobTitle: 0.10,
  },
  
  minProfileCompletenessThreshold: 30, // 30% minimum completeness
  
  applicationSpeed: {
    maxHoursForFullScore: 2, // Full score if applied within 2 hours
    scoreDecayPerHour: 2, // Lose 2 points per hour after job creation
  },
};

/**
 * Get the number of candidates to highlight based on job settings
 */
export function getHighlightedCandidateCount(
  performCustomScreening: boolean,
  customCount?: number,
): number {
  // If performCustomScreening is false, always return 1
  if (!performCustomScreening) {
    return 1;
  }
  
  // Use custom count if provided, otherwise use default
  return customCount ?? VETTING_CONFIG.defaultHighlightedCandidateCount;
}