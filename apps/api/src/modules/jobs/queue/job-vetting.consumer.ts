import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import { Job as JobEntity } from '@app/common/database/entities';
import { JobStatus } from '@app/common/database/entities/schema.enum';
import {
  JOB_VETTING_JOBS,
  type VetJobData,
  type VetAllPendingJobsData,
} from '../types/job-vetting.types';
import { JobVettingService } from '../services/job-vetting.service';

/**
 * Consumer/processor for job vetting queue
 * Processes vetting jobs and handles batch operations
 */
@Processor(QUEUE_NAMES.JOB_VETTING)
@Injectable()
export class JobVettingConsumer {
  private readonly logger = new Logger(JobVettingConsumer.name);

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
    private readonly jobVettingService: JobVettingService,
  ) {}

  /**
   * Process single job vetting
   */
  @Process(JOB_VETTING_JOBS.VET_JOB)
  async processJobVetting(job: Job<VetJobData>) {
    const { jobId, triggeredBy } = job.data;
    const bullJobId = job.id;

    this.logger.log(
      `Processing vetting for job ${jobId} (Bull job ${bullJobId}), triggered by: ${triggeredBy}`,
    );

    try {
      // Check if job exists and is published
      const jobEntity = await this.jobRepo.findOne({
        where: { id: jobId },
        relations: ['applications'],
      });

      if (!jobEntity) {
        throw new Error(`Job ${jobId} not found`);
      }

      if (jobEntity.status !== JobStatus.PUBLISHED) {
        this.logger.warn(
          `Job ${jobId} is not published (status: ${jobEntity.status}), skipping vetting`,
        );
        return {
          success: false,
          reason: 'Job not published',
          jobId,
          bullJobId,
        };
      }

      // Check if job already has vetting completed recently
      if (jobEntity.vettingCompletedAt) {
        const hoursSinceVetting =
          (Date.now() - jobEntity.vettingCompletedAt.getTime()) /
          (1000 * 60 * 60);
        if (hoursSinceVetting < 1 && triggeredBy !== 'manual') {
          this.logger.debug(
            `Job ${jobId} was vetted ${hoursSinceVetting.toFixed(1)} hours ago, skipping`,
          );
          return {
            success: false,
            reason: 'Recently vetted',
            jobId,
            bullJobId,
          };
        }
      }

      // Perform vetting
      const result = await this.jobVettingService.vetJobApplications(jobId);

      this.logger.log(
        `Vetting completed for job ${jobId}: ${result.totalApplicants} applicants, ${result.highlightedCount} highlighted`,
      );

      // Try to send notification to admin (don't fail the whole job if this fails)
      try {
        await this.jobVettingService.notifyAdminVettingComplete(jobId, result);
        this.logger.log(
          `Vetting completion notification sent for job ${jobId}`,
        );
      } catch (notificationError) {
        this.logger.error(
          `Failed to send vetting completion notification for job ${jobId}`,
          notificationError.stack,
        );
        // Continue with success - the vetting itself was successful
      }

      return {
        success: true,
        jobId,
        bullJobId,
        result,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Vetting failed for job ${jobId} (Bull job ${bullJobId})`,
        error.stack,
      );
      throw new Error(`Vetting failed for job ${jobId}: ${error.message}`);
    }
  }

  /**
   * Process all published jobs with applications that need vetting
   */
  @Process(JOB_VETTING_JOBS.VET_ALL_PENDING)
  async processAllPendingVetting(job: Job<VetAllPendingJobsData>) {
    const { batchSize = 50, triggeredBy } = job.data;
    const bullJobId = job.id;

    this.logger.log(
      `Processing all pending vetting jobs (Bull job ${bullJobId}), triggered by: ${triggeredBy}`,
    );

    try {
      // Find published jobs that have applications and either:
      // 1. Haven't been vetted yet, OR
      // 2. Have new applications since last vetting
      const jobs = await this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.applications', 'application')
        .where('job.status = :status', { status: JobStatus.PUBLISHED })
        .andWhere('application.id IS NOT NULL') // Has applications
        .andWhere(
          '(job.vettingCompletedAt IS NULL OR ' +
            'EXISTS (SELECT 1 FROM job_applications ja WHERE ja.jobId = job.id AND ja.createdAt > job.vettingCompletedAt))',
        )
        .groupBy('job.id')
        .take(batchSize)
        .getMany();

      this.logger.log(`Found ${jobs.length} jobs that need vetting`);

      let processed = 0;
      let failed = 0;

      for (const jobEntity of jobs) {
        try {
          const result = await this.jobVettingService.vetJobApplications(
            jobEntity.id,
          );

          // Try to send notification to admin (don't fail the job if this fails)
          try {
            await this.jobVettingService.notifyAdminVettingComplete(
              jobEntity.id,
              result,
            );
          } catch (notificationError) {
            this.logger.error(
              `Failed to send vetting completion notification for job ${jobEntity.id}`,
              notificationError.stack,
            );
            // Continue - the vetting itself was successful
          }

          processed++;
          this.logger.debug(
            `Vetted job ${jobEntity.id}: ${result.totalApplicants} applicants, ${result.highlightedCount} highlighted`,
          );
        } catch (error) {
          failed++;
          this.logger.error(`Failed to vet job ${jobEntity.id}`, error.stack);
        }
      }

      this.logger.log(
        `Batch vetting completed: ${processed} processed, ${failed} failed`,
      );

      return {
        success: true,
        bullJobId,
        totalFound: jobs.length,
        processed,
        failed,
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Batch vetting failed (Bull job ${bullJobId})`,
        error.stack,
      );
      throw new Error(`Batch vetting failed: ${error.message}`);
    }
  }

  /**
   * Handle completed jobs
   */
  @Process('completed')
  async onCompleted(job: Job, result: any) {
    this.logger.debug(`Vetting job #${job.id} completed`, {
      jobId: job.id,
      result,
    });
  }

  /**
   * Handle failed jobs
   */
  @Process('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Vetting job #${job.id} failed permanently`,
      error.stack,
      {
        jobId: job.id,
        attempts: job.attemptsMade,
        data: job.data,
      },
    );
  }
}
