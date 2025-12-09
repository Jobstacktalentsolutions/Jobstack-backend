import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueStalled,
} from '@nestjs/bull';
import * as Bull from 'bull';
import { Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { JobSeekerProfile } from '@app/common/database/entities';
import { QUEUE_NAMES } from '@app/common/queue';
import { JobRecommendationsProcessor } from '../services/job-recommendations.processor';
import {
  JOB_RECOMMENDATION_JOBS,
  type PrecalculateAllRecommendationsJobData,
  type PrecalculateSingleRecommendationJobData,
  type PrecalculateAllResult,
  type PrecalculateSingleResult,
} from '../types/job-recommendations.types';

/**
 * Bull Queue Consumer for job recommendations
 * Handles background processing of recommendation calculations
 * 
 * This consumer processes two types of jobs:
 * 1. PRECALCULATE_ALL - Daily scheduled job to precalculate for all users
 * 2. PRECALCULATE_SINGLE - On-demand calculation for a single user
 */
@Processor(QUEUE_NAMES.JOB_RECOMMENDATIONS)
export class JobRecommendationsConsumer {
  private readonly logger = new Logger(JobRecommendationsConsumer.name);

  // Cache TTL: 24 hours in seconds
  private readonly CACHE_TTL = 86400;

  constructor(
    @InjectRepository(JobSeekerProfile)
    private readonly jobSeekerRepo: Repository<JobSeekerProfile>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly recommendationsProcessor: JobRecommendationsProcessor,
  ) {}

  /**
   * Process job to precalculate recommendations for ALL job seekers
   * This is the main scheduled job that runs daily
   */
  @Process(JOB_RECOMMENDATION_JOBS.PRECALCULATE_ALL)
  async handlePrecalculateAll(
    job: Bull.Job<PrecalculateAllRecommendationsJobData>,
  ): Promise<PrecalculateAllResult> {
    const startTime = Date.now();
    this.logger.log(
      `Processing job ${job.id}: Precalculating all recommendations...`,
    );

    const { batchSize = 50 } = job.data;

    // Get all job seeker profiles
    const profiles = await this.jobSeekerRepo.find({
      select: ['id'],
    });

    this.logger.log(`Found ${profiles.length} job seeker profiles to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process in batches to avoid memory issues
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);

      // Process batch concurrently
      const results = await Promise.allSettled(
        batch.map((profile) => this.processProfileRecommendations(profile.id)),
      );

      // Count successes and failures
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          this.logger.error(`Batch processing error: ${result.reason}`);
        }
      });

      // Update job progress
      const progress = Math.round(((i + batch.length) / profiles.length) * 100);
      await job.progress(progress);
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `Precalculation completed in ${duration}ms. Success: ${successCount}, Errors: ${errorCount}`,
    );

    return { successCount, errorCount, total: profiles.length, duration };
  }

  /**
   * Process job to precalculate recommendations for a SINGLE job seeker
   * Used for on-demand recalculation or after profile updates
   */
  @Process(JOB_RECOMMENDATION_JOBS.PRECALCULATE_SINGLE)
  async handlePrecalculateSingle(
    job: Bull.Job<PrecalculateSingleRecommendationJobData>,
  ): Promise<PrecalculateSingleResult> {
    const { jobSeekerId, page = 1, limit = 100 } = job.data;

    this.logger.log(
      `Processing job ${job.id}: Precalculating for user ${jobSeekerId}`,
    );

    try {
      await this.processProfileRecommendations(jobSeekerId, page, limit);
      return { jobSeekerId, success: true, cached: true };
    } catch (error) {
      this.logger.error(
        `Failed to precalculate for user ${jobSeekerId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Core method to process recommendations for a single profile
   */
  private async processProfileRecommendations(
    jobSeekerId: string,
    page: number = 1,
    limit: number = 100,
  ): Promise<void> {
    try {
      const recommendations =
        await this.recommendationsProcessor.calculateRecommendations(
          jobSeekerId,
          { page, limit },
        );

      const cacheKey = this.getCacheKey(jobSeekerId, page, limit);
      await this.cacheManager.set(cacheKey, recommendations, this.CACHE_TTL);
    } catch (error) {
      this.logger.error(
        `Failed to calculate recommendations for profile ${jobSeekerId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Generate cache key for recommendations
   */
  private getCacheKey(jobSeekerId: string, page: number, limit: number): string {
    return `job-recommendations:${jobSeekerId}:page:${page}:limit:${limit}`;
  }

  // Queue event handlers for logging and monitoring
  @OnQueueActive()
  onActive(job: Bull.Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}...`);
  }

  @OnQueueCompleted()
  onCompleted(job: Bull.Job, result: unknown) {
    this.logger.log(`Job ${job.id} (${job.name}) completed successfully`);
    this.logger.debug(`Job ${job.id} result: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Bull.Job, error: Error) {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed: ${error.message}`,
      error.stack,
    );
  }

  @OnQueueStalled()
  onStalled(job: Bull.Job) {
    this.logger.warn(`Job ${job.id} (${job.name}) stalled and will be retried`);
  }
}
