import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JobSeekerProfile } from '@app/common/database/entities';
import { JobRecommendationsProcessor } from './job-recommendations.processor';
import { JobRecommendationQueryDto } from '../dto';

/**
 * Scheduled job service for pre-calculating job recommendations
 * Runs daily at midnight to cache recommendations for all job seekers
 */
@Injectable()
export class JobRecommendationsScheduler {
  private readonly logger = new Logger(JobRecommendationsScheduler.name);

  constructor(
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly recommendationsProcessor: JobRecommendationsProcessor,
  ) {}

  // Runs daily at midnight (00:00:00) to pre-calculate recommendations
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'precalculate-job-recommendations',
    timeZone: 'UTC',
  })
  async precalculateRecommendations() {
    this.logger.log('Starting daily job recommendations pre-calculation...');

    try {
      // Get all job seeker profiles
      const profiles = await this.jobSeekerRepo.find({
        select: ['id'],
      });

      this.logger.log(`Processing ${profiles.length} job seeker profiles...`);

      let successCount = 0;
      let errorCount = 0;

      // Process each profile
      for (const profile of profiles) {
        try {
          // Calculate recommendations with default pagination
          const query: JobRecommendationQueryDto = {
            page: 1,
            limit: 100, // Cache first 100 recommendations
          };

          const recommendations =
            await this.recommendationsProcessor.calculateRecommendations(
              profile.id,
              query,
            );

          // Cache the recommendations for 24 hours (86400 seconds)
          const cacheKey = this.getCacheKey(profile.id, query.page ?? 1, query.limit ?? 20);
          await this.cacheManager.set(cacheKey, recommendations, 86400);

          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to calculate recommendations for profile ${profile.id}: ${error.message}`,
          );
          errorCount++;
        }
      }

      this.logger.log(
        `Job recommendations pre-calculation completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error during job recommendations pre-calculation: ${error.message}`,
        error.stack,
      );
    }
  }

  // Helper method to generate cache key
  private getCacheKey(jobSeekerId: string, page: number, limit: number): string {
    return `job-recommendations:${jobSeekerId}:page:${page}:limit:${limit}`;
  }
}

