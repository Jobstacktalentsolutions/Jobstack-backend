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
import {
  JOB_MATCHING_CONFIG,
  CORE_FACTORS_WEIGHT,
} from '../config/matching.config';

// Local shorthands from config
const W = JOB_MATCHING_CONFIG.WEIGHTS;
const C = JOB_MATCHING_CONFIG;

// Seniority keywords for title boost
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

@Injectable()
export class JobRecommendationsProcessor {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
  ) {}

  /**
   * Calculates recommendations with a strict relevancy filter (Core Gate).
   */
  async calculateRecommendations(
    jobSeekerId: string,
    query: JobRecommendationQueryDto,
  ): Promise<{ items: Job[]; total: number; page: number; limit: number }> {
    const profile = await this.jobSeekerRepo.findOne({
      where: { id: jobSeekerId },
      relations: ['userSkills', 'userSkills.skill'],
    });

    if (!profile) {
      throw new Error(`Job seeker profile not found: ${jobSeekerId}`);
    }

    // Pre-calculate profile matching details
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

    // Initial query for candidate jobs
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

    // Score jobs and filter by CORE gate
    const scoredJobs = allJobs
      .map((job) =>
        this.scoreJob(
          profile,
          job,
          userSkillIds,
          userSkillNames,
          userSkillCategories,
        ),
      )
      .filter(
        (result): result is { job: Job; score: number } => result !== null,
      );

    // Sort by score (desc) then recency
    scoredJobs.sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.job.createdAt).getTime() -
          new Date(a.job.createdAt).getTime(),
    );

    // Pagination
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const startIndex = (page - 1) * limit;

    return {
      items: scoredJobs.slice(startIndex, startIndex + limit).map((r) => r.job),
      total: scoredJobs.length,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------------------
  // Matching Engine
  // ---------------------------------------------------------------------------

  private scoreJob(
    profile: JobSeekerProfile,
    job: Job,
    userSkillIds: string[],
    userSkillNames: Set<string>,
    userSkillCategories: Set<SkillCategory>,
  ): { job: Job; score: number } | null {
    // 1. Calculate Core Determinants
    const skillScore =
      this.calcSkillScore(job, userSkillIds, userSkillNames) * W.skillMatch;
    const catScore =
      (job.category && userSkillCategories.has(job.category) ? 1.0 : 0) *
      W.categoryMatch;
    const titleScore =
      (profile.jobTitle
        ? this.calcTitleMatch(profile.jobTitle, job.title)
        : 0) * W.titleSimilarity;
    const tagScore = this.calcTagScore(job.tags, profile.brief) * W.tags;

    const coreScoreSum = skillScore + catScore + titleScore + tagScore;

    // CORE GATE: If ratio is below threshold, exclude immediately
    const relevancyRatio = coreScoreSum / CORE_FACTORS_WEIGHT;
    if (relevancyRatio < C.MIN_CORE_RELEVANCY_RATIO) {
      return null;
    }

    // 2. Calculate Secondary "Buffer" Factors
    const locationScore =
      (this.calcLocationScore(profile, job) / 100) * W.location;
    const prefScore = this.calcPrefScore(profile, job);
    const salaryScore =
      this.calcSalaryScore(
        profile.minExpectedSalary,
        profile.maxExpectedSalary,
        job.salary,
      ) * W.salary;

    const totalScore = coreScoreSum + locationScore + prefScore + salaryScore;

    return {
      job,
      score: Math.round(totalScore * 100) / 100,
    };
  }

  // ---------------------------------------------------------------------------
  // Detail logic
  // ---------------------------------------------------------------------------

  private calcSkillScore(
    job: Job,
    userSkillIds: string[],
    userSkillNames: Set<string>,
  ): number {
    if (!job.skills || job.skills.length === 0) return 0.5; // neutral
    if (userSkillIds.length === 0) return 0;

    let matchCount = 0;
    const uIdSet = new Set(userSkillIds);

    for (const jSkill of job.skills) {
      if (uIdSet.has(jSkill.id)) {
        matchCount += 1.0;
      } else {
        const fuzzyVal = this.bestFuzzySimilarity(jSkill.name, userSkillNames);
        if (fuzzyVal >= C.FUZZY_THRESHOLD)
          matchCount += fuzzyVal * C.FUZZY_CREDIT_RATIO;
      }
    }

    const intersection = matchCount;
    const union = userSkillIds.length + job.skills.length - intersection;
    return union > 0 ? Math.min(1, intersection / union) : 0;
  }

  private calcTagScore(
    tags: string[] | undefined,
    brief: string | undefined,
  ): number {
    if (!tags || tags.length === 0) return 0;
    if (!brief) return 0;

    const summary = brief
      .substring(0, C.MAX_FUZZY_MATCH_TEXT_LENGTH)
      .toLowerCase();
    let totalTagMatches = 0;

    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      // Fast check: direct inclusion
      if (summary.includes(tagLower)) {
        totalTagMatches += 1.0;
        continue;
      }

      // Fuzzy check: Jaro-Winkler across words (performance safety)
      const words = summary.split(/\s+/).slice(0, 100); // Only fuzzy match first 100 words
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

  private calcTitleMatch(userTitle: string, jobTitle: string): number {
    const a = userTitle.toLowerCase();
    const b = jobTitle.toLowerCase();
    const jaro = JaroWinklerDistance(a, b);
    const aLevel = SENIORITY_KEYWORDS.find((k) => a.includes(k));
    const bLevel = SENIORITY_KEYWORDS.find((k) => b.includes(k));
    const bonus = aLevel && bLevel && aLevel === bLevel ? 0.08 : 0;
    return Math.min(1, jaro + bonus);
  }

  private calcSalaryScore(uMin?: number, uMax?: number, jVal?: number): number {
    if (!jVal || (!uMin && !uMax)) return 0.5;
    const minExpected = uMin ?? 0;
    if (jVal >= minExpected) return 1.0; // Meets criteria or pays more
    const gapRatio = (minExpected - jVal) / minExpected;
    return gapRatio <= 0.2 ? 1 - gapRatio : 0; // Partial match if within 20%
  }

  private calcLocationScore(p: JobSeekerProfile, j: Job): number {
    if (!j.state && !j.city) return 50;
    if (j.city && p.city && j.city.toLowerCase() === p.city.toLowerCase())
      return 100;
    if (j.state && p.state && j.state.toLowerCase() === p.state.toLowerCase())
      return 50;
    return 0;
  }

  private calcPrefScore(p: JobSeekerProfile, j: Job): number {
    let s = 0;
    if (p.preferredEmploymentType === j.employmentType) s += 3;
    if (p.preferredWorkMode === j.workMode) s += 3;
    if (p.preferredEmploymentArrangement === j.employmentArrangement) s += 2;
    return s;
  }

  private bestFuzzySimilarity(name: string, pool: Set<string>): number {
    const target = name.toLowerCase();
    let best = 0;
    for (const p of pool) {
      const sim = JaroWinklerDistance(target, p);
      if (sim > best) best = sim;
      if (best > 0.98) break;
    }
    return best;
  }

  private baseJobQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.skills', 'skill')
      .leftJoinAndSelect('job.employer', 'employer');
  }
}
