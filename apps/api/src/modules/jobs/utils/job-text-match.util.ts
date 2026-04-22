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

/** How well job tags overlap jobseeker brief (0–1), same approach as job recommendations */
export function computeTagBriefMatch(
  tags: string[] | undefined,
  brief: string | undefined,
): number {
  if (!tags?.length) return 0;
  if (!brief) return 0;
  const summary = brief
    .substring(0, C.MAX_FUZZY_MATCH_TEXT_LENGTH)
    .toLowerCase();
  let totalTagMatches = 0;

  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    if (summary.includes(tagLower)) {
      totalTagMatches += 1;
      continue;
    }
    const words = summary.split(/\s+/).slice(0, 100);
    let bestWordSim = 0;
    for (const word of words) {
      if (word.length < 3) continue;
      const sim = JaroWinklerDistance(tagLower, word);
      if (sim > bestWordSim) bestWordSim = sim;
      if (bestWordSim > 0.95) break;
    }
    if (bestWordSim >= C.FUZZY_THRESHOLD)
      totalTagMatches += bestWordSim * C.FUZZY_CREDIT_RATIO;
  }

  return Math.min(1, totalTagMatches / tags.length);
}

/** Combined text signal 0–100 for job-post notifications */
export function computeTextMatchScore(
  job: { title: string; tags?: string[] },
  profile: { jobTitle?: string; brief?: string },
): number {
  const titlePart = computeTitleSimilarity(profile.jobTitle, job.title) * 100;
  const tagPart = computeTagBriefMatch(job.tags, profile.brief) * 100;
  return Math.round((titlePart * 0.55 + tagPart * 0.45) * 100) / 100;
}
