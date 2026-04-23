import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import { Job as JobEntity } from '@app/common/database/entities';
import {
  JobStatus,
  isJobOpenOnMarketplace,
} from '@app/common/database/entities/schema.enum';
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

      if (!isJobOpenOnMarketplace(jobEntity.status)) {
        this.logger.warn(
          `Job ${jobId} is not live on marketplace (status: ${jobEntity.status}), skipping vetting`,
        );
        return {
          success: false,
          reason: 'Job not published',
          jobId,
          bullJobId,
        };
      }

      // Debounce repeat vetting within 1h unless new applications arrived after last vetting
      if (jobEntity.vettingCompletedAt) {
        const hoursSinceVetting =
          (Date.now() - jobEntity.vettingCompletedAt.getTime()) /
          (1000 * 60 * 60);
        const completedAt = jobEntity.vettingCompletedAt.getTime();
        const hasNewApplicationsSinceVetting = (
          jobEntity.applications ?? []
        ).some((app) => new Date(app.createdAt).getTime() > completedAt);
        if (
          hoursSinceVetting < 1 &&
          triggeredBy !== 'manual' &&
          !hasNewApplicationsSinceVetting
        ) {
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

      // Notify admin only when there were applicants to vet (skip empty noise)
      if (result.totalApplicants > 0) {
        try {
          await this.jobVettingService.notifyEmployerVettingComplete(
            jobId,
            result,
          );
          this.logger.log(
            `Vetting completion notification sent for job ${jobId}`,
          );
        } catch (notificationError: any) {
          this.logger.error(
            `Failed to send vetting completion notification for job ${jobId}`,
            notificationError?.stack,
          );
          // Continue with success - the vetting itself was successful
        }
      }

      return {
        success: true,
        jobId,
        bullJobId,
        result,
        processedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Vetting failed for job ${jobId} (Bull job ${bullJobId})`,
        error?.stack,
      );
      throw new Error(`Vetting failed for job ${jobId}: ${error?.message}`);
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

    let jobs: JobEntity[] = [];

    try {
      // Find published jobs that have applications and either:
      // 1. Haven't been vetted yet, OR
      // 2. Have new applications since last vetting
      this.logger.debug('Building query to find jobs that need vetting');

      jobs = await this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.applications', 'application')
        .where('job.status IN (:...liveStatuses)', {
          liveStatuses: [JobStatus.PUBLISHED, JobStatus.ACTIVE],
        })
        .andWhere('application.id IS NOT NULL') // Has applications
        .andWhere(
          '(job.vettingCompletedAt IS NULL OR ' +
            'EXISTS (SELECT 1 FROM job_applications ja WHERE ja."jobId" = job.id AND ja."createdAt" > job."vettingCompletedAt"))',
        )
        .groupBy('job.id')
        .take(batchSize)
        .getMany();

      this.logger.log(
        `Found ${jobs.length} jobs that need vetting (batchSize: ${batchSize})`,
      );
    } catch (queryError: any) {
      this.logger.error(
        `Failed to query jobs for vetting (Bull job ${bullJobId})`,
        queryError?.stack,
      );
      throw new Error(
        `Failed to query jobs for vetting: ${queryError?.message}`,
      );
    }

    try {
      let processed = 0;
      let failed = 0;
      const errors: Array<{ jobId: string; error: string }> = [];

      for (const jobEntity of jobs) {
        try {
          this.logger.debug(`Starting vetting for job ${jobEntity.id}`);
          const result = await this.jobVettingService.vetJobApplications(
            jobEntity.id,
          );

          // Try to send notification to admin (don't fail the job if this fails)
          try {
            await this.jobVettingService.notifyEmployerVettingComplete(
              jobEntity.id,
              result,
            );
          } catch (notificationError: any) {
            this.logger.error(
              `Failed to send vetting completion notification for job ${jobEntity.id}`,
              notificationError?.stack,
            );
            // Continue - the vetting itself was successful
          }

          processed++;
          this.logger.debug(
            `Vetted job ${jobEntity.id}: ${result.totalApplicants} applicants, ${result.highlightedCount} highlighted`,
          );
        } catch (error: any) {
          failed++;
          const errorMessage = error?.message || 'Unknown error';
          errors.push({ jobId: jobEntity.id, error: errorMessage });
          this.logger.error(
            `Failed to vet job ${jobEntity.id}: ${errorMessage}`,
            error?.stack,
          );
        }
      }

      this.logger.log(
        `Batch vetting completed: ${processed} processed, ${failed} failed`,
      );

      if (errors.length > 0) {
        this.logger.warn(
          `Batch vetting errors summary: ${JSON.stringify(errors, null, 2)}`,
        );
      }

      return {
        success: true,
        bullJobId,
        totalFound: jobs.length,
        processed,
        failed,
        errors: errors.length > 0 ? errors : undefined,
        processedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Batch vetting failed (Bull job ${bullJobId})`,
        error?.stack,
      );
      throw new Error(`Batch vetting failed: ${error?.message}`);
    }
  }

  /**
   * Handle completed jobs
   */
  @Process('completed')
  onCompleted(job: Job, result: any) {
    this.logger.debug(`Vetting job #${job.id} completed`, {
      jobId: job.id,
      result,
    });
  }

  /**
   * Handle failed jobs
   */
  @Process('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Vetting job #${job.id} failed permanently`,
      error?.stack,
      {
        jobId: job.id,
        attempts: job.attemptsMade,
        data: job.data,
      },
    );
  }
}
