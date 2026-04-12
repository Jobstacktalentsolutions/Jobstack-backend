/**
 * Bull payload: notify matching jobseekers after a job is published.
 */

export const JOB_POST_MATCH_NOTIFY_JOBS = {
  NOTIFY_MATCHES: 'notify-job-matches',
} as const;

export interface NotifyJobMatchesData {
  jobId: string;
  triggeredAt: string;
}
