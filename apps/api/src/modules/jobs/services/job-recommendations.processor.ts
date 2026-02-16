import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Job, JobSeekerProfile } from '@app/common/database/entities';
import {
  JobStatus,
  SkillCategory,
} from '@app/common/database/entities/schema.enum';
import { JobRecommendationQueryDto } from '../dto';

// Interface for recommendation result
export interface RecommendationResult {
  items: Job[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Processor service for calculating job recommendations
 * This service contains the core calculation logic that can be reused
 * by both the recommendations service and scheduled jobs
 */
@Injectable()
export class JobRecommendationsProcessor {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
  ) {}

  // Calculates and returns job recommendations for a job seeker
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

    // Get user skill IDs, names, synonyms, and categories
    const userSkillIds = profile.userSkills?.map((us) => us.skillId) ?? [];
    const userSkillNames = new Set(
      profile.userSkills
        ?.map((us) => us.skill?.name.toLowerCase())
        .filter(Boolean) ?? [],
    );
    const userSkillSynonyms = new Set<string>();
    profile.userSkills?.forEach((us) => {
      if (us.skill?.synonyms) {
        us.skill.synonyms.forEach((syn) =>
          userSkillSynonyms.add(syn.toLowerCase()),
        );
      }
    });
    const userSkillCategories = new Set<SkillCategory>(
      profile.userSkills
        ?.map((us) => us.skill?.category)
        .filter((c): c is SkillCategory => c !== undefined && c !== null) ?? [],
    );

    // Get jobs that are published and not expired
    const qb = this.baseJobQuery()
      .where('job.status = :status', { status: JobStatus.PUBLISHED })
      .andWhere(
        '(job.applicationDeadline IS NULL OR job.applicationDeadline > :now)',
        { now: new Date() },
      );

    // Exclude jobs the user has already applied to using a subquery
    qb.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM job_applications application 
        WHERE application."jobId" = job.id 
        AND application."jobseekerProfileId" = :jobSeekerId
      )`,
      { jobSeekerId },
    );

    const allJobs = await qb.getMany();

    // Score and rank jobs
    const scoredJobs = allJobs.map((job) => ({
      job,
      score: this.calculateMatchScore(
        profile,
        job,
        userSkillIds,
        userSkillNames,
        userSkillSynonyms,
        userSkillCategories,
      ),
    }));

    // Sort by score (descending), then by createdAt (descending) for recency
    scoredJobs.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 0.01) {
        // If scores are very close, prioritize recency
        return (
          new Date(b.job.createdAt).getTime() -
          new Date(a.job.createdAt).getTime()
        );
      }
      return b.score - a.score;
    });

    // Apply pagination
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = scoredJobs.slice(startIndex, endIndex);

    return {
      items: paginatedJobs.map((item) => item.job),
      total: scoredJobs.length,
      page,
      limit,
    };
  }

  // Calculates match score between job seeker profile and a job
  private calculateMatchScore(
    profile: JobSeekerProfile,
    job: Job,
    userSkillIds: string[],
    userSkillNames: Set<string>,
    userSkillSynonyms: Set<string>,
    userSkillCategories: Set<SkillCategory>,
  ): number {
    let score = 0;

    // Skill matching with synonym support (35% weight)
    if (job.skills && job.skills.length > 0) {
      let matchingSkillsCount = 0;
      let synonymMatchesCount = 0;

      job.skills.forEach((jobSkill) => {
        // Direct ID match
        if (userSkillIds.includes(jobSkill.id)) {
          matchingSkillsCount++;
        } else {
          // Synonym matching - check if job skill name or synonyms match user skills
          const jobSkillNameLower = jobSkill.name.toLowerCase();
          const jobSkillSynonyms = (jobSkill.synonyms || []).map((s) =>
            s.toLowerCase(),
          );

          // Check if job skill name matches user skill names or synonyms
          if (
            userSkillNames.has(jobSkillNameLower) ||
            userSkillSynonyms.has(jobSkillNameLower)
          ) {
            matchingSkillsCount++;
          }
          // Check if job skill synonyms match user skill names
          else if (
            jobSkillSynonyms.some(
              (syn) => userSkillNames.has(syn) || userSkillSynonyms.has(syn),
            )
          ) {
            synonymMatchesCount++;
          }
        }
      });

      const totalMatches = matchingSkillsCount + synonymMatchesCount * 0.7; // Synonym matches get 70% weight
      const skillMatchRatio =
        job.skills.length > 0 ? totalMatches / job.skills.length : 0;
      score += skillMatchRatio * 35;
    }

    // Category matching (25% weight)
    if (userSkillCategories.size > 0 && job.category) {
      if (userSkillCategories.has(job.category as SkillCategory)) {
        score += 25;
      }
    }

    // Employment preferences matching (12% weight)
    let employmentPreferenceScore = 0;
    if (profile.preferredEmploymentType && job.employmentType) {
      if (profile.preferredEmploymentType === job.employmentType) {
        employmentPreferenceScore += 4;
      }
    }
    if (profile.preferredWorkMode && job.workMode) {
      if (profile.preferredWorkMode === job.workMode) {
        employmentPreferenceScore += 4;
      }
    }
    if (profile.preferredEmploymentArrangement && job.employmentArrangement) {
      if (
        profile.preferredEmploymentArrangement === job.employmentArrangement
      ) {
        employmentPreferenceScore += 4;
      }
    }
    score += employmentPreferenceScore;

    // Location matching (12% weight)
    if (profile.state && job.state) {
      if (profile.state.toLowerCase() === job.state.toLowerCase()) {
        score += 12;
      } else if (profile.city && job.city) {
        if (profile.city.toLowerCase() === job.city.toLowerCase()) {
          score += 8;
        }
      }
    } else if (profile.preferredLocation && job.city) {
      if (
        profile.preferredLocation.toLowerCase().includes(job.city.toLowerCase())
      ) {
        score += 8;
      }
    }

    // Salary range overlap (10% weight)
    const salaryOverlap = this.calculateSalaryOverlap(
      profile.minExpectedSalary,
      profile.maxExpectedSalary,
      job.salary,
      job.salary,
    );
    score += salaryOverlap * 10;

    // Job title similarity (6% weight)
    if (profile.jobTitle && job.title) {
      const titleSimilarity = this.calculateTitleSimilarity(
        profile.jobTitle,
        job.title,
      );
      score += titleSimilarity * 6;
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  // Calculates salary range overlap percentage
  private calculateSalaryOverlap(
    userMin?: number,
    userMax?: number,
    jobMin?: number,
    jobMax?: number,
  ): number {
    // If no salary info on either side, return 0
    if ((!userMin && !userMax) || (!jobMin && !jobMax)) {
      return 0;
    }

    // Normalize to have both min and max
    const userMinVal = userMin ?? 0;
    const userMaxVal = userMax ?? Number.MAX_SAFE_INTEGER;
    const jobMinVal = jobMin ?? 0;
    const jobMaxVal = jobMax ?? Number.MAX_SAFE_INTEGER;

    // Calculate overlap
    const overlapMin = Math.max(userMinVal, jobMinVal);
    const overlapMax = Math.min(userMaxVal, jobMaxVal);

    // No overlap
    if (overlapMin > overlapMax) {
      return 0;
    }

    // Calculate overlap percentage based on the smaller range
    const userRange = userMaxVal - userMinVal;
    const jobRange = jobMaxVal - jobMinVal;
    const overlapRange = overlapMax - overlapMin;
    const smallerRange = Math.min(userRange, jobRange);

    if (smallerRange === 0) {
      // If one range is a single point, check if it's within the other range
      return overlapMin <= Math.max(userMaxVal, jobMaxVal) ? 1 : 0;
    }

    return Math.min(1, overlapRange / smallerRange);
  }

  // Calculates job title similarity
  private calculateTitleSimilarity(
    userTitle: string,
    jobTitle: string,
  ): number {
    const userTitleLower = userTitle.toLowerCase().trim();
    const jobTitleLower = jobTitle.toLowerCase().trim();

    // Exact match
    if (userTitleLower === jobTitleLower) {
      return 1.0;
    }

    // Check if one title contains the other
    if (
      userTitleLower.includes(jobTitleLower) ||
      jobTitleLower.includes(userTitleLower)
    ) {
      return 0.8;
    }

    // Split into words and check for common words
    const userWords = userTitleLower.split(/\s+/);
    const jobWords = jobTitleLower.split(/\s+/);
    const commonWords = userWords.filter((word) => jobWords.includes(word));

    // Calculate word overlap ratio
    const totalUniqueWords = new Set([...userWords, ...jobWords]).size;
    if (totalUniqueWords === 0) return 0;

    return commonWords.length / totalUniqueWords;
  }

  // Builds base query with eager relations for recommendations
  private baseJobQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.skills', 'skill')
      .leftJoinAndSelect('job.employer', 'employer')
      .orderBy('job.createdAt', 'DESC'); // Add default ordering by recency
  }
}
