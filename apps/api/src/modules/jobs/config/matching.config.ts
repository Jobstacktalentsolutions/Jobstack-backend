/**
 * Configuration for the job recommendation engine
 */

export const JOB_MATCHING_CONFIG = {
  /**
   * Core determinative factors must reach this ratio of their potential weight
   * to consider the job relevant. If (coreScore / totalCoreWeight) < threshold, 
   * the job is excluded regardless of location/salary.
   */
  MIN_CORE_RELEVANCY_RATIO: 0.25,

  /**
   * Performance setting: Fuzzy matching is expensive on long strings. 
   * We limit description and user brief fields to this length.
   */
  MAX_FUZZY_MATCH_TEXT_LENGTH: 3000,

  /**
   * Scoring weights (should sum to 100 for easy interpretation)
   */
  WEIGHTS: {
    // --- CORE DETERMINANTS (74 total) ---
    skillMatch: 28,      // Jaccard + Fuzzy fallback
    categoryMatch: 18,   // Exact SkillCategory alignment
    titleSimilarity: 18, // Jaro-Winkler: jobTitle vs title
    tags: 10,            // Fuzzy matching tags against user profile brief

    // --- BUFFER FACTORS (26 total) ---
    location: 10,        // Geo proximity (city > state > preferred)
    employmentPrefs: 8,  // type / workMode / arrangement matches
    salary: 8,           // Acceptance check (point jobSalary vs user range)
  },

  /**
   * Fuzzy matching sensitivity (0 to 1)
   * Higher = more strict exact match required.
   */
  FUZZY_THRESHOLD: 0.88,
  FUZZY_CREDIT_RATIO: 0.75, // Credit for a fuzzy match vs an exact one
};

/**
 * Calculated list of core factors for the relevancy gate
 */
export const CORE_FACTORS_WEIGHT = 
  JOB_MATCHING_CONFIG.WEIGHTS.skillMatch + 
  JOB_MATCHING_CONFIG.WEIGHTS.categoryMatch + 
  JOB_MATCHING_CONFIG.WEIGHTS.titleSimilarity + 
  JOB_MATCHING_CONFIG.WEIGHTS.tags;
