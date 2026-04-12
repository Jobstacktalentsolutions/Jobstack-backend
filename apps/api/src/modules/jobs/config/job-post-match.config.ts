/**
 * Background job: when a job is published, notify matching jobseekers by email.
 */

export const JOB_POST_MATCH_CONFIG = {
  /** Minimum vetting-style score (0–100) before text bonus */
  MIN_BASE_SCORE: 38,
  /** Maximum points added from title/tags text matching (0–100 scale mapped to points) */
  MAX_TEXT_SCORE_POINTS: 14,
  /** Exclude profiles below this completeness (same scale as vetting) */
  MIN_PROFILE_COMPLETENESS: 30,
  /** Max profiles to load and score per job (performance cap) */
  MAX_CANDIDATES_TO_SCORE: 800,
  /** Max emails actually sent per published job */
  MAX_EMAILS_PER_JOB: 400,
} as const;
