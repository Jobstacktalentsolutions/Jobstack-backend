/**
 * Type definitions for job vetting queue operations
 */

export const JOB_VETTING_JOBS = {
  VET_JOB: 'vet-job',
  VET_ALL_PENDING: 'vet-all-pending',
} as const;

export type JobVettingJobType = (typeof JOB_VETTING_JOBS)[keyof typeof JOB_VETTING_JOBS];

export interface VetJobData {
  jobId: string;
  triggeredBy: 'status-change' | 'manual' | 'schedule';
  triggeredAt: string; // ISO date string
}

export interface VetAllPendingJobsData {
  batchSize?: number;
  triggeredBy: 'schedule' | 'manual';
  triggeredAt: string; // ISO date string
}