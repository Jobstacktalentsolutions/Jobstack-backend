import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Job, JobSeekerProfile } from '@app/common/database/entities';
import { JobStatus } from '@app/common/database/entities/schema.enum';
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
    const userSkillCategories = new Set(
      profile.userSkills?.map((us) => us.skill?.category).filter(Boolean) ?? [],
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
    userSkillCategories: Set<string>,
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

    // Enhanced category matching with fuzzy search (25% weight)
    if (userSkillCategories.size > 0) {
      const categoryMatch = this.enhancedCategoryMatch(
        Array.from(userSkillCategories),
        job.category,
      );
      if (categoryMatch) {
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
      if (profile.preferredEmploymentArrangement === job.employmentArrangement) {
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
      job.salaryMin,
      job.salaryMax,
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

  // Enhanced category matching with fuzzy search
  private enhancedCategoryMatch(
    skillCategories: string[],
    jobCategory: string,
  ): boolean {
    // Enhanced bidirectional category mapping
    const categoryMap: Record<string, string[]> = {
      TECHNOLOGY: [
        'TECHNICAL',
        'SOFTWARE_DEVELOPMENT',
        'DATABASE',
        'TECHNOLOGY',
      ],
      BUSINESS: ['BUSINESS', 'FINANCE_ACCOUNTING'],
      DESIGN: ['DESIGN'],
      MARKETING: ['SALES_MARKETING', 'SOCIAL_MEDIA', 'COMMUNICATION'],
      OPERATIONS: ['OPERATIONS'],
      FINANCE: ['FINANCE_ACCOUNTING', 'BUSINESS'],
      CUSTOMER_SERVICE: ['COMMUNICATION', 'SALES_MARKETING'],
      HOME_SERVICES: ['HOME_SUPPORT'],
      MAINTENANCE: ['MAINTENANCE_TRADES'],
      HOSPITALITY: ['HOSPITALITY'],
      SECURITY: ['SECURITY'],
      TRANSPORT: ['TRANSPORT_LOGISTICS'],
    };

    // Direct match check
    const matchingCategories = categoryMap[jobCategory] ?? [];
    if (
      skillCategories.some((sc) =>
        matchingCategories.some((mc) => mc === sc),
      )
    ) {
      return true;
    }

    // Fuzzy matching - check for partial matches and similar category names
    const jobCategoryLower = jobCategory.toLowerCase();
    const fuzzyMatches = skillCategories.some((sc) => {
      const scLower = sc.toLowerCase();
      // Check if skill category contains job category keywords or vice versa
      return (
        scLower.includes(jobCategoryLower) ||
        jobCategoryLower.includes(scLower) ||
        this.areCategoriesSimilar(sc, jobCategory)
      );
    });

    return fuzzyMatches;
  }

  // Checks if two category names are similar (fuzzy matching)
  private areCategoriesSimilar(cat1: string, cat2: string): boolean {
    const cat1Lower = cat1.toLowerCase();
    const cat2Lower = cat2.toLowerCase();

    // Exact match
    if (cat1Lower === cat2Lower) return true;

    // Check for common keywords
    const commonKeywords = [
      ['tech', 'technical', 'technology'],
      ['business', 'finance'],
      ['marketing', 'sales', 'communication'],
      ['design', 'creative'],
      ['operations', 'operational'],
      ['hospitality', 'service'],
      ['maintenance', 'repair', 'trades'],
      ['transport', 'logistics', 'delivery'],
      ['security', 'safety'],
      ['home', 'household', 'domestic'],
    ];

    for (const keywordGroup of commonKeywords) {
      const cat1HasKeyword = keywordGroup.some((kw) => cat1Lower.includes(kw));
      const cat2HasKeyword = keywordGroup.some((kw) => cat2Lower.includes(kw));
      if (cat1HasKeyword && cat2HasKeyword) {
        return true;
      }
    }

    // Levenshtein-like similarity for short category names
    if (cat1Lower.length <= 15 && cat2Lower.length <= 15) {
      const similarity = this.calculateStringSimilarity(cat1Lower, cat2Lower);
      return similarity > 0.7; // 70% similarity threshold
    }

    return false;
  }

  // Calculates string similarity using a simple algorithm
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Simple Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
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
    const wordSimilarity = commonWords.length / totalUniqueWords;

    // Use string similarity for additional scoring
    const stringSimilarity = this.calculateStringSimilarity(
      userTitleLower,
      jobTitleLower,
    );

    // Combine both metrics
    return wordSimilarity * 0.6 + stringSimilarity * 0.4;
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

