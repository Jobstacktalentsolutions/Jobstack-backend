import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_VETTING_JOBS,
  type VetJobData,
  type VetAllPendingJobsData,
} from '../types/job-vetting.types';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'apps/api/src/modules/config';

/**
 * Producer service for job vetting queue
 * Handles adding vetting jobs to the queue and managing scheduled jobs
 */
@Injectable()
export class JobVettingProducer implements OnModuleInit {
  private readonly logger = new Logger(JobVettingProducer.name);

  // Repeatable job key for the daily vetting job
  private readonly DAILY_VETTING_JOB_KEY = 'daily-vet-all-pending';

  constructor(
    @InjectQueue(QUEUE_NAMES.JOB_VETTING)
    private readonly vettingQueue: Bull.Queue,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize the daily scheduled job on module startup
   */
  async onModuleInit() {
    const disableJobs = this.configService.get(ENV.DISABLE_JOBS);
    if (!disableJobs) {
      await this.setupDailyVettingJob();
    }
  }

  /**
   * Set up the daily vetting job
   * Runs at 2 AM UTC every day
   */
  private async setupDailyVettingJob(): Promise<void> {
    try {
      // Remove any existing repeatable jobs with this key to avoid duplicates
      const existingJobs = await this.vettingQueue.getRepeatableJobs();
      for (const job of existingJobs) {
        if (job.key.includes(this.DAILY_VETTING_JOB_KEY)) {
          await this.vettingQueue.removeRepeatableByKey(job.key);
          this.logger.log(`Removed existing repeatable vetting job: ${job.key}`);
        }
      }

      // Add the new repeatable job
      await this.vettingQueue.add(
        JOB_VETTING_JOBS.VET_ALL_PENDING,
        {
          batchSize: 50,
          triggeredBy: 'schedule',
          triggeredAt: new Date().toISOString(),
        } as VetAllPendingJobsData,
        {
          repeat: {
            cron: '0 2 * * *', // Every day at 2 AM UTC
            tz: 'UTC',
          },
          jobId: this.DAILY_VETTING_JOB_KEY,
          removeOnComplete: 10, // Keep last 10 completed jobs
          removeOnFail: 5, // Keep last 5 failed jobs
        },
      );

      this.logger.log(
        'Daily job vetting scheduled (2 AM UTC)',
      );
    } catch (error) {
      this.logger.error(
        `Failed to setup daily vetting job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Queue vetting for a specific job
   */
  async queueJobVetting(
    jobId: string,
    triggeredBy: 'status-change' | 'manual' = 'manual',
  ): Promise<{ jobId: string | number }> {
    const job = await this.vettingQueue.add(
      JOB_VETTING_JOBS.VET_JOB,
      {
        jobId,
        triggeredBy,
        triggeredAt: new Date().toISOString(),
      } as VetJobData,
      {
        priority: triggeredBy === 'status-change' ? 1 : 5, // Higher priority for status changes
        removeOnComplete: true,
        removeOnFail: false,
        // Deduplicate jobs for the same job ID
        jobId: `vet-job-${jobId}`,
      },
    );

    this.logger.log(`Vetting job queued for job ${jobId} with ID: ${job.id}`);
    return { jobId: job.id };
  }

  /**
   * Manually trigger vetting for all pending jobs
   */
  async triggerVetAllPending(
    batchSize: number = 50,
  ): Promise<{ jobId: string | number }> {
    const job = await this.vettingQueue.add(
      JOB_VETTING_JOBS.VET_ALL_PENDING,
      {
        batchSize,
        triggeredBy: 'manual',
        triggeredAt: new Date().toISOString(),
      } as VetAllPendingJobsData,
      {
        priority: 1, // Higher priority for manual triggers
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Manual vet-all-pending job queued with ID: ${job.id}`);
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
        this.vettingQueue.getWaitingCount(),
        this.vettingQueue.getActiveCount(),
        this.vettingQueue.getCompletedCount(),
        this.vettingQueue.getFailedCount(),
        this.vettingQueue.getDelayedCount(),
        this.vettingQueue.getPausedCount(),
      ]);

    return { waiting, active, completed, failed, delayed, paused };
  }

  /**
   * Get list of repeatable jobs for monitoring
   */
  async getRepeatableJobs() {
    return this.vettingQueue.getRepeatableJobs();
  }

  /**
   * Pause the queue (useful for maintenance)
   */
  async pauseQueue(): Promise<void> {
    await this.vettingQueue.pause();
    this.logger.warn('Job vetting queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.vettingQueue.resume();
    this.logger.log('Job vetting queue resumed');
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
    const removed = await this.vettingQueue.clean(grace, status);
    this.logger.log(`Cleaned ${removed.length} ${status} jobs from vetting queue`);
    return removed;
  }
}