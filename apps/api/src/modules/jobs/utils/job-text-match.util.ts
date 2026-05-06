import { JaroWinklerDistance } from 'natural';
import { JOB_MATCHING_CONFIG } from '../config/matching.config';

const C = JOB_MATCHING_CONFIG;

// Seniority keywords for title boost (aligned with recommendation engine)
const SENIORITY_KEYWORDS = [
  'junior',
  'entry',
  'mid',
  'mid-level',
  'senior',
  'lead',
  'principal',
  'staff',
  'head',
];

/** Jaro–Winkler similarity between profile job title and job title, 0–1 */
export function computeTitleSimilarity(
  userTitle: string | undefined,
  jobTitle: string,
): number {
  if (!userTitle?.trim()) return 0;
  const a = userTitle.toLowerCase();
  const b = jobTitle.toLowerCase();
  const jaro = JaroWinklerDistance(a, b);
  const aLevel = SENIORITY_KEYWORDS.find((k) => a.includes(k));
  const bLevel = SENIORITY_KEYWORDS.find((k) => b.includes(k));
  const bonus = aLevel && bLevel && aLevel === bLevel ? 0.08 : 0;
  return Math.min(1, jaro + bonus);
}

/** Combined text signal 0–100 for job-post notifications */
export function computeTextMatchScore(
  job: { title: string },
  profile: { jobTitle?: string },
): number {
  const titlePart = computeTitleSimilarity(profile.jobTitle, job.title) * 100;
  return Math.round(titlePart * 100) / 100;
}
