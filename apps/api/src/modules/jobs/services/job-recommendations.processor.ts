import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { JaroWinklerDistance } from 'natural';
import { Job, JobSeekerProfile } from '@app/common/database/entities';
import {
  JobStatus,
  SkillCategory,
} from '@app/common/database/entities/schema.enum';
import { JobRecommendationQueryDto } from '../dto';

// Minimum Jaro-Winkler similarity to count a fuzzy skill name match
const FUZZY_SKILL_THRESHOLD = 0.88;

// Fuzzy skill matches get partial credit relative to an exact ID match
const FUZZY_SKILL_CREDIT = 0.75;

// Seniority keywords used in title comparison boost
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

/**
 * Scoring weights — all sum to 100.
 * Title is elevated to 18 (was 6) as the strongest single intent signal.
 */
const W = {
  skillMatch: 28, // Jaccard + Jaro-Winkler fuzzy fallback
  categoryMatch: 18, // Exact SkillCategory alignment
  titleSimilarity: 18, // Jaro-Winkler: profile jobTitle vs job title
  location: 12, // Geo proximity (city > state > preferred)
  tags: 8, // Job tags fuzzy-matched against profile jobTitle
  employmentPrefs: 8, // type / workMode / arrangement
  salary: 8, // Point salary vs user expected range
} as const;

export interface RecommendationResult {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Processor service for calculating job recommendations.
 * Uses natural's JaroWinklerDistance for title + skill fuzzy matching,
 * Jaccard similarity for skill set overlap, and a corrected salary
 * point-in-range acceptance check.
 */
@Injectable()
export class JobRecommendationsProcessor {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
  ) {}

  async calculateRecommendations(
    jobSeekerId: string,
    query: JobRecommendationQueryDto,
  ): Promise<RecommendationResult> {
    const profile = await this.jobSeekerRepo.findOne({
      where: { id: jobSeekerId },
      relations: ['userSkills', 'userSkills.skill'],
    });

    if (!profile) {
      throw new Error(`Job seeker profile not found: ${jobSeekerId}`);
    }

    // Pre-compute derived user skill sets once — avoids repetition per job
    const userSkillIds = profile.userSkills?.map((us) => us.skillId) ?? [];
    const userSkillNames = new Set<string>(
      profile.userSkills
        ?.map((us) => us.skill?.name?.toLowerCase())
        .filter(Boolean) ?? [],
    );
    const userSkillCategories = new Set<SkillCategory>(
      profile.userSkills
        ?.map((us) => us.skill?.category)
        .filter((c): c is SkillCategory => !!c) ?? [],
    );

    // Fetch published, non-expired jobs the seeker has not yet applied to
    const qb = this.baseJobQuery()
      .where('job.status = :status', { status: JobStatus.PUBLISHED })
      .andWhere(
        '(job.applicationDeadline IS NULL OR job.applicationDeadline > :now)',
        { now: new Date() },
      )
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM job_applications application
          WHERE application."jobId" = job.id
          AND application."jobseekerProfileId" = :jobSeekerId
        )`,
        { jobSeekerId },
      );

    const allJobs = await qb.getMany();

    // Score every job and rank
    const scoredJobs = allJobs.map((job) => ({
      job,
      score: this.calculateMatchScore(
        profile,
        job,
        userSkillIds,
        userSkillNames,
        userSkillCategories,
      ),
    }));

    // Sort descending by score; use createdAt recency as tiebreaker
    scoredJobs.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) {
        return (
          new Date(b.job.createdAt).getTime() -
          new Date(a.job.createdAt).getTime()
        );
      }
      return b.score - a.score;
    });

    // Paginate
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const paginatedJobs = scoredJobs.slice(startIndex, startIndex + limit);

    return {
      items: paginatedJobs.map((item) => item.job),
      total: scoredJobs.length,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------------------
  // Core scoring
  // ---------------------------------------------------------------------------

  private calculateMatchScore(
    profile: JobSeekerProfile,
    job: Job,
    userSkillIds: string[],
    userSkillNames: Set<string>,
    userSkillCategories: Set<SkillCategory>,
  ): number {
    let score = 0;

    // 1. Skill match — Jaccard with Jaro-Winkler fuzzy fallback (28%)
    score +=
      this.calculateJaccardSkillScore(job, userSkillIds, userSkillNames) *
      W.skillMatch;

    // 2. Category match — exact enum alignment (18%)
    if (userSkillCategories.size > 0 && job.category) {
      if (userSkillCategories.has(job.category)) {
        score += W.categoryMatch;
      }
    }

    // 3. Title similarity — Jaro-Winkler (18%)
    if (profile.jobTitle && job.title) {
      score +=
        this.calculateTitleSimilarity(profile.jobTitle, job.title) *
        W.titleSimilarity;
    }

    // 4. Location proximity — normalised 0-100 → 0-12 (12%)
    score += (this.calculateLocationScore(profile, job) / 100) * W.location;

    // 5. Tags match — job tags vs profile jobTitle (8%)
    score += this.calculateTagsScore(profile, job) * W.tags;

    // 6. Employment preferences — type / workMode / arrangement (max 8)
    score += this.calculateEmploymentPreferenceScore(profile, job);

    // 7. Salary acceptance — job salary as point, user salary as range (8%)
    score +=
      this.calculateSalaryAcceptance(
        profile.minExpectedSalary,
        profile.maxExpectedSalary,
        job.salary,
      ) * W.salary;

    return Math.round(score * 100) / 100;
  }

  // ---------------------------------------------------------------------------
  // Individual scoring methods
  // ---------------------------------------------------------------------------

  /**
   * Jaccard similarity with fuzzy skill name fallback.
   *
   * For each job skill:
   *   - Exact ID match  → 1.0 credit (counts in intersection)
   *   - Jaro-Winkler ≥ FUZZY_SKILL_THRESHOLD → FUZZY_SKILL_CREDIT (0.75) credit
   *
   * Jaccard = intersection / union (symmetric, penalises both over-broad and
   * under-broad skill sets proportionally).
   *
   * Returns 0-1. Returns 0.5 (neutral) when the job lists no required skills.
   */
  private calculateJaccardSkillScore(
    job: Job,
    userSkillIds: string[],
    userSkillNames: Set<string>,
  ): number {
    if (!job.skills || job.skills.length === 0) return 0.5;
    if (userSkillIds.length === 0) return 0;

    const userIdSet = new Set(userSkillIds);
    let exactCount = 0;
    let fuzzyWeightedCount = 0;

    for (const jobSkill of job.skills) {
      if (userIdSet.has(jobSkill.id)) {
        exactCount++;
      } else {
        // Jaro-Winkler fuzzy match against all user skill names
        const bestSim = this.bestFuzzySkillSimilarity(
          jobSkill.name,
          userSkillNames,
        );
        if (bestSim >= FUZZY_SKILL_THRESHOLD) {
          fuzzyWeightedCount += bestSim * FUZZY_SKILL_CREDIT;
        }
      }
    }

    // Weighted intersection and union for Jaccard
    const intersection = exactCount + fuzzyWeightedCount;
    const union = userSkillIds.length + job.skills.length - intersection;

    return union > 0 ? Math.min(1, intersection / union) : 0;
  }

  /**
   * Returns the highest Jaro-Winkler score between a job skill name and
   * any skill the user has listed.
   */
  private bestFuzzySkillSimilarity(
    skillName: string,
    userSkillNames: Set<string>,
  ): number {
    const nameLower = skillName.toLowerCase();
    let best = 0;
    for (const uName of userSkillNames) {
      const sim = JaroWinklerDistance(nameLower, uName);
      if (sim > best) best = sim;
    }
    return best;
  }

  /**
   * Title similarity using Jaro-Winkler.
   * Prefix-sensitive — handles "Senior React Developer" vs "React Developer" well.
   * Adds a small bonus when both titles share the same seniority keyword.
   * Returns 0-1.
   */
  private calculateTitleSimilarity(
    userTitle: string,
    jobTitle: string,
  ): number {
    const a = userTitle.toLowerCase().trim();
    const b = jobTitle.toLowerCase().trim();

    const jaroScore = JaroWinklerDistance(a, b);

    // Seniority alignment bonus: +0.08 if both titles share the same level word
    const aLevel = SENIORITY_KEYWORDS.find((kw) => a.includes(kw));
    const bLevel = SENIORITY_KEYWORDS.find((kw) => b.includes(kw));
    const seniorityBonus =
      aLevel && bLevel && aLevel === bLevel ? 0.08 : 0;

    return Math.min(1, jaroScore + seniorityBonus);
  }

  /**
   * Tags score: measures how well job.tags align with the jobseeker's jobTitle.
   * Uses substring containment (strong signal) then falls back to
   * Jaro-Winkler word-level fuzzy matching.
   * Returns 0-1.
   */
  private calculateTagsScore(
    profile: JobSeekerProfile,
    job: Job,
  ): number {
    if (!job.tags || job.tags.length === 0) return 0;
    if (!profile.jobTitle) return 0;

    const profileTitleLower = profile.jobTitle.toLowerCase();
    // Split into meaningful words (skip single/dual-char noise)
    const profileWords = profileTitleLower
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let bestScore = 0;

    for (const tag of job.tags) {
      const tagLower = tag.toLowerCase();

      // Strong signal: direct substring containment
      if (
        profileTitleLower.includes(tagLower) ||
        tagLower.includes(profileTitleLower)
      ) {
        return 1.0;
      }

      // Fuzzy: compare tag against each meaningful word in profile title
      for (const word of profileWords) {
        const sim = JaroWinklerDistance(tagLower, word);
        if (sim > bestScore) bestScore = sim;
      }
    }

    // Only reward when above threshold; soften partial near-misses
    return bestScore >= FUZZY_SKILL_THRESHOLD ? bestScore : bestScore * 0.5;
  }

  /**
   * Salary acceptance check.
   *
   * job.salary is a single point value (not a range).
   * We check whether it falls within the jobseeker's expected range:
   *   - job.salary >= userMin AND user range exists → full score (1.0)
   *   - job.salary above userMax → still attractive, full score (1.0)
   *   - job.salary < userMin → partial credit if within 20% of minimum
   *   - No salary data on either side → neutral (0.5)
   *
   * Returns 0-1.
   */
  private calculateSalaryAcceptance(
    userMin?: number,
    userMax?: number,
    jobSalary?: number,
  ): number {
    // Insufficient data → neutral, don't penalise
    if (!jobSalary || (!userMin && !userMax)) return 0.5;

    const min = userMin ?? 0;

    // Job pays at or above user's minimum (or above maximum — still good)
    if (jobSalary >= min) return 1.0;

    // Job pays below minimum — partial credit if shortfall ≤ 20%
    const shortfall = (min - jobSalary) / min;
    if (shortfall <= 0.2) return Math.round((1 - shortfall) * 100) / 100;

    // More than 20% below minimum → no salary match
    return 0;
  }

  /**
   * Location proximity score.
   * Returns 0-100 (normalised to 0-1 by the caller).
   */
  private calculateLocationScore(
    profile: JobSeekerProfile,
    job: Job,
  ): number {
    if (!job.state && !job.city) return 50; // no location on job → neutral

    let score = 0;

    // Exact city match → highest score
    if (job.city && profile.city) {
      if (job.city.toLowerCase().trim() === profile.city.toLowerCase().trim()) {
        return 100;
      }
    }

    // State match
    if (job.state && profile.state) {
      if (
        job.state.toLowerCase().trim() === profile.state.toLowerCase().trim()
      ) {
        score += 50;

        // Partial city match bonus within same state
        if (job.city && profile.city) {
          const jc = job.city.toLowerCase();
          const pc = profile.city.toLowerCase();
          if (jc.includes(pc) || pc.includes(jc)) {
            score += 25;
          }
        }
      }
    }

    // Preferred location fallback
    if (score === 0 && profile.preferredLocation) {
      const preferred = profile.preferredLocation.toLowerCase();
      if (job.city && preferred.includes(job.city.toLowerCase())) {
        score += 35;
      } else if (job.state && preferred.includes(job.state.toLowerCase())) {
        score += 25;
      }
    }

    // Address-level locality hint
    if (score < 100 && job.address && profile.address) {
      const ja = job.address.toLowerCase();
      const pa = profile.address.toLowerCase();
      if (
        ja.includes(pa.split(',')[0]) ||
        pa.includes(ja.split(',')[0])
      ) {
        score += 15;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Employment preference scoring.
   * Max 8 points to fit updated weight distribution.
   *   - employmentType match: +3
   *   - workMode match:       +3
   *   - arrangement match:    +2
   */
  private calculateEmploymentPreferenceScore(
    profile: JobSeekerProfile,
    job: Job,
  ): number {
    let score = 0;
    if (profile.preferredEmploymentType && job.employmentType) {
      if (profile.preferredEmploymentType === job.employmentType) score += 3;
    }
    if (profile.preferredWorkMode && job.workMode) {
      if (profile.preferredWorkMode === job.workMode) score += 3;
    }
    if (profile.preferredEmploymentArrangement && job.employmentArrangement) {
      if (
        profile.preferredEmploymentArrangement === job.employmentArrangement
      ) {
        score += 2;
      }
    }
    return score;
  }

  private baseJobQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.skills', 'skill')
      .leftJoinAndSelect('job.employer', 'employer')
      .orderBy('job.createdAt', 'DESC');
  }
}
