import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_RECOMMENDATION_JOBS,
  type PrecalculateAllRecommendationsJobData,
  type PrecalculateSingleRecommendationJobData,
} from '../types/job-recommendations.types';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'apps/api/src/modules/config';

/**
 * Producer service for job recommendations queue
 * Handles adding jobs to the queue and managing repeatable jobs
 *
 * Implements OnModuleInit to set up the daily scheduled job on startup
 */
@Injectable()
export class JobRecommendationsProducer implements OnModuleInit {
  private readonly logger = new Logger(JobRecommendationsProducer.name);

  // Repeatable job key for the daily precalculation
  private readonly DAILY_JOB_KEY = 'daily-precalculate-recommendations';

  constructor(
    @InjectQueue(QUEUE_NAMES.JOB_RECOMMENDATIONS)
    private readonly recommendationsQueue: Bull.Queue,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize the daily scheduled job on module startup
   * Uses Bull's repeatable jobs feature for cron-like scheduling
   */
  async onModuleInit() {
    const disableJob = this.configService.get(ENV.DISABLE_JOBS);
    if (!disableJob) {
      await this.setupDailyPrecalculationJob();
    }
  }

  /**
   * Set up the daily precalculation job
   * Runs at midnight UTC every day
   */
  private async setupDailyPrecalculationJob(): Promise<void> {
    try {
      // Remove any existing repeatable jobs with this key to avoid duplicates
      const existingJobs = await this.recommendationsQueue.getRepeatableJobs();
      for (const job of existingJobs) {
        if (job.key.includes(this.DAILY_JOB_KEY)) {
          await this.recommendationsQueue.removeRepeatableByKey(job.key);
          this.logger.log(`Removed existing repeatable job: ${job.key}`);
        }
      }

      // Add the new repeatable job
      await this.recommendationsQueue.add(
        JOB_RECOMMENDATION_JOBS.PRECALCULATE_ALL,
        {
          batchSize: 50,
          triggeredBy: 'schedule',
          triggeredAt: new Date().toISOString(),
        } as PrecalculateAllRecommendationsJobData,
        {
          repeat: {
            cron: '0 0 * * *', // Every day at midnight (00:00)
            tz: 'UTC',
          },
          jobId: this.DAILY_JOB_KEY,
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 5, // Keep last 5 failed jobs
        },
      );

      this.logger.log(
        'Daily job recommendations precalculation scheduled (midnight UTC)',
      );
    } catch (error) {
      this.logger.error(
        `Failed to setup daily precalculation job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Manually trigger precalculation for all job seekers
   * Useful for admin operations or after major data changes
   */
  async triggerPrecalculateAll(
    batchSize: number = 50,
  ): Promise<{ jobId: string | number }> {
    const job = await this.recommendationsQueue.add(
      JOB_RECOMMENDATION_JOBS.PRECALCULATE_ALL,
      {
        batchSize,
        triggeredBy: 'manual',
        triggeredAt: new Date().toISOString(),
      } as PrecalculateAllRecommendationsJobData,
      {
        priority: 1, // Higher priority for manual triggers
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Manual precalculation job queued with ID: ${job.id}`);
    return { jobId: job.id };
  }

  /**
   * Queue a job to precalculate recommendations for a single job seeker
   * Used for cache misses or after profile updates
   */
  async queueSinglePrecalculation(
    jobSeekerId: string,
    options?: {
      page?: number;
      limit?: number;
      triggeredBy?: 'cache-miss' | 'profile-update' | 'manual';
      priority?: number;
    },
  ): Promise<{ jobId: string | number }> {
    const {
      page = 1,
      limit = 100,
      triggeredBy = 'manual',
      priority = 5,
    } = options ?? {};

    const jobOptions: Bull.JobOptions = {
      priority,
      removeOnComplete: true,
      removeOnFail: false,
      // Deduplicate jobs for the same user
      jobId: `single-${jobSeekerId}-${page}-${limit}`,
    };

    const job = await this.recommendationsQueue.add(
      JOB_RECOMMENDATION_JOBS.PRECALCULATE_SINGLE,
      {
        jobSeekerId,
        page,
        limit,
        triggeredBy,
      } as PrecalculateSingleRecommendationJobData,
      jobOptions,
    );

    this.logger.debug(
      `Single precalculation job queued for user ${jobSeekerId} with ID: ${job.id}`,
    );
    return { jobId: job.id };
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: number;
  }> {
    const [waiting, active, completed, failed, delayed, paused] =
      await Promise.all([
        this.recommendationsQueue.getWaitingCount(),
        this.recommendationsQueue.getActiveCount(),
        this.recommendationsQueue.getCompletedCount(),
        this.recommendationsQueue.getFailedCount(),
        this.recommendationsQueue.getDelayedCount(),
        this.recommendationsQueue.getPausedCount(),
      ]);

    return { waiting, active, completed, failed, delayed, paused };
  }

  /**
   * Get list of repeatable jobs for monitoring
   */
  async getRepeatableJobs() {
    return this.recommendationsQueue.getRepeatableJobs();
  }

  /**
   * Pause the queue (useful for maintenance)
   */
  async pauseQueue(): Promise<void> {
    await this.recommendationsQueue.pause();
    this.logger.warn('Job recommendations queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.recommendationsQueue.resume();
    this.logger.log('Job recommendations queue resumed');
  }

  /**
   * Clean old jobs from the queue
   */
  async cleanQueue(
    grace: number = 1000 * 60 * 60, // 1 hour default
    status:
      | 'completed'
      | 'wait'
      | 'active'
      | 'delayed'
      | 'failed' = 'completed',
  ): Promise<Bull.Job[]> {
    const removed = await this.recommendationsQueue.clean(grace, status);
    this.logger.log(`Cleaned ${removed.length} ${status} jobs from queue`);
    return removed;
  }
}
