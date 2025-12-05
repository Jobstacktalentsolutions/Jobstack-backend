import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobSeekerProfile } from '@app/common/database/entities';
import { JobRecommendationQueryDto } from '../dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JobRecommendationsProcessor } from './job-recommendations.processor';

/**
 * Service for getting job recommendations with smart caching
 * Uses cache when available, falls back to calculation if cache miss or skipCache is true
 */
@Injectable()
export class JobRecommendationsService {
  constructor(
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly recommendationsProcessor: JobRecommendationsProcessor,
  ) {}

  // Gets job recommendations for a job seeker with smart caching
  async getJobRecommendations(
    jobSeekerId: string,
    query: JobRecommendationQueryDto,
  ) {
    // Verify profile exists
    const profile = await this.jobSeekerRepo.findOne({
      where: { id: jobSeekerId },
      select: ['id'],
    });

    if (!profile) {
      throw new NotFoundException('Job seeker profile not found');
    }

    const cacheKey = this.getCacheKey(jobSeekerId, query);

    // If skipCache is true, calculate and update cache
    if (query.skipCache) {
      const recommendations =
        await this.recommendationsProcessor.calculateRecommendations(
          jobSeekerId,
          query,
        );
      // Cache for 24 hours (86400 seconds)
      await this.cacheManager.set(cacheKey, recommendations, 86400);
      return recommendations;
    }

    // Try to get from cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Cache miss - calculate recommendations
    const recommendations =
      await this.recommendationsProcessor.calculateRecommendations(
        jobSeekerId,
        query,
      );

    // Cache the result for 24 hours (86400 seconds)
    await this.cacheManager.set(cacheKey, recommendations, 86400);

    return recommendations;
  }

  // Helper method to generate cache key
  private getCacheKey(
    jobSeekerId: string,
    query: JobRecommendationQueryDto,
  ): string {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return `job-recommendations:${jobSeekerId}:page:${page}:limit:${limit}`;
  }
}
