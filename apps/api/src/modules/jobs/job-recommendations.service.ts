import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Job,
  JobSeekerProfile,
} from '@app/common/database/entities';
import { JobRecommendationQueryDto } from './dto';
import { JobStatus } from '@app/common/database/entities/schema.enum';

@Injectable()
export class JobRecommendationsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
  ) {}

  // Gets job recommendations for a job seeker based on skills and preferences
  async getJobRecommendations(
    jobSeekerId: string,
    query: JobRecommendationQueryDto,
  ) {
    const profile = await this.jobSeekerRepo.findOne({
      where: { id: jobSeekerId },
      relations: ['userSkills', 'userSkills.skill'],
    });

    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    // Get user skill IDs and categories
    const userSkillIds = profile.userSkills?.map((us) => us.skillId) ?? [];
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
        WHERE application.jobId = job.id 
        AND application.jobseekerProfileId = :jobSeekerId
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
        userSkillCategories,
      ),
    }));

    // Sort by score (descending) and filter out jobs with 0 score
    scoredJobs.sort((a, b) => b.score - a.score);
    const filteredJobs = scoredJobs.filter((item) => item.score > 0);

    // Apply pagination
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return {
      items: paginatedJobs.map((item) => item.job),
      total: filteredJobs.length,
      page,
      limit,
    };
  }

  // Calculates match score between job seeker profile and a job
  private calculateMatchScore(
    profile: JobSeekerProfile,
    job: Job,
    userSkillIds: string[],
    userSkillCategories: Set<string>,
  ): number {
    let score = 0;

    // Skill matching (40% weight)
    if (job.skills && job.skills.length > 0 && userSkillIds.length > 0) {
      const jobSkillIds = job.skills.map((s) => s.id);
      const matchingSkills = jobSkillIds.filter((id) =>
        userSkillIds.includes(id),
      );
      const skillMatchRatio = matchingSkills.length / jobSkillIds.length;
      score += skillMatchRatio * 40;
    }

    // Category matching (30% weight) - match user skill categories to job category
    if (userSkillCategories.size > 0) {
      const categoryMatch = this.mapSkillCategoryToJobCategory(
        Array.from(userSkillCategories),
        job.category,
      );
      if (categoryMatch) {
        score += 30;
      }
    }

    // Location matching (15% weight)
    if (profile.state && job.state) {
      if (profile.state.toLowerCase() === job.state.toLowerCase()) {
        score += 15;
      } else if (profile.city && job.city) {
        if (profile.city.toLowerCase() === job.city.toLowerCase()) {
          score += 10;
        }
      }
    } else if (profile.preferredLocation && job.city) {
      if (
        profile.preferredLocation.toLowerCase().includes(job.city.toLowerCase())
      ) {
        score += 10;
      }
    }

    // Salary expectation matching (10% weight)
    if (
      profile.minExpectedSalary &&
      job.salaryMax &&
      profile.minExpectedSalary <= job.salaryMax
    ) {
      score += 10;
    } else if (
      profile.maxExpectedSalary &&
      job.salaryMin &&
      profile.maxExpectedSalary >= job.salaryMin
    ) {
      score += 10;
    }

    // Experience level bonus (5% weight)
    if (profile.yearsOfExperience && job.tags) {
      const experienceTags = job.tags.filter(
        (tag) =>
          tag.toLowerCase().includes('experience') ||
          tag.toLowerCase().includes('years'),
      );
      if (experienceTags.length > 0) {
        score += 5;
      }
    }

    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  // Maps skill categories to job categories for matching
  private mapSkillCategoryToJobCategory(
    skillCategories: string[],
    jobCategory: string,
  ): boolean {
    const categoryMap: Record<string, string[]> = {
      TECHNOLOGY: ['TECHNICAL', 'SOFTWARE_DEVELOPMENT', 'DATABASE'],
      BUSINESS: ['BUSINESS', 'FINANCE_ACCOUNTING'],
      DESIGN: ['DESIGN'],
      MARKETING: ['SALES_MARKETING', 'SOCIAL_MEDIA', 'COMMUNICATION'],
      OPERATIONS: ['OPERATIONS'],
      FINANCE: ['FINANCE_ACCOUNTING'],
      CUSTOMER_SERVICE: ['COMMUNICATION'],
      HOME_SERVICES: ['HOME_SUPPORT'],
      MAINTENANCE: ['MAINTENANCE_TRADES'],
      HOSPITALITY: ['HOSPITALITY'],
      SECURITY: ['SECURITY'],
      TRANSPORT: ['TRANSPORT_LOGISTICS'],
    };

    const matchingCategories = categoryMap[jobCategory] ?? [];
    return skillCategories.some((sc) =>
      matchingCategories.some((mc) => mc === sc),
    );
  }

  // Builds base query with eager relations for recommendations
  private baseJobQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.skills', 'skill')
      .leftJoinAndSelect('job.employer', 'employer');
  }
}

