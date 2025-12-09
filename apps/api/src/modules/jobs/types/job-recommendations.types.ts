/**
 * Job types and data interfaces for job recommendations queue
 */

/**
 * Job names for the recommendations queue
 */
export const JOB_RECOMMENDATION_JOBS = {
  PRECALCULATE_ALL: 'precalculate-all-recommendations',
  PRECALCULATE_SINGLE: 'precalculate-single-recommendation',
} as const;

export type JobRecommendationJobName =
  (typeof JOB_RECOMMENDATION_JOBS)[keyof typeof JOB_RECOMMENDATION_JOBS];

/**
 * Job data for precalculating recommendations for all job seekers
 */
export interface PrecalculateAllRecommendationsJobData {
  batchSize?: number;
  triggeredBy?: 'schedule' | 'manual';
  triggeredAt?: string;
}

/**
 * Job data for precalculating recommendations for a single job seeker
 */
export interface PrecalculateSingleRecommendationJobData {
  jobSeekerId: string;
  page?: number;
  limit?: number;
  triggeredBy?: 'cache-miss' | 'profile-update' | 'manual';
}

/**
 * Result of precalculating all recommendations
 */
export interface PrecalculateAllResult {
  successCount: number;
  errorCount: number;
  total: number;
  duration: number;
}

/**
 * Result of precalculating a single recommendation
 */
export interface PrecalculateSingleResult {
  jobSeekerId: string;
  success: boolean;
  cached: boolean;
}
