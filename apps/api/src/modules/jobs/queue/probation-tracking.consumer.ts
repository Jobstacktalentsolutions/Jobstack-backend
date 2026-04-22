import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_PROBATION_TRACKING_JOBS,
  type ProbationReminderJobData,
  type ProbationConfirmJobData,
} from '../types/probation-tracking.types';
import { ProbationTrackingService } from '../services/probation-tracking.service';

/**
 * Bull consumer for per-employee probation milestones.
 */
@Processor(QUEUE_NAMES.JOB_PROBATION_TRACKING)
@Injectable()
export class ProbationTrackingConsumer {
  private readonly logger = new Logger(ProbationTrackingConsumer.name);

  constructor(
    private readonly probationTrackingService: ProbationTrackingService,
  ) {}

  @Process(JOB_PROBATION_TRACKING_JOBS.PROBATION_REMINDER)
  async handleProbationReminder(
    job: Job<ProbationReminderJobData>,
  ): Promise<void> {
    const { employeeId } = job.data;
    this.logger.log(`Probation reminder job for employee ${employeeId}`);
    await this.probationTrackingService.sendProbationReminder(employeeId);
  }

  @Process(JOB_PROBATION_TRACKING_JOBS.PROBATION_CONFIRM)
  async handleProbationConfirm(
    job: Job<ProbationConfirmJobData>,
  ): Promise<void> {
    const { employeeId } = job.data;
    this.logger.log(`Probation confirm job for employee ${employeeId}`);
    await this.probationTrackingService.confirmProbation(employeeId);
  }

  @Process('completed')
  async onCompleted(job: Job, result: unknown): Promise<void> {
    this.logger.debug(`Probation job ${job.id} completed`, { result });
  }

  @Process('failed')
  async onFailed(job: Job, error: Error): Promise<void> {
    this.logger.error(`Probation job ${job.id} failed: ${error.message}`, {
      stack: error.stack,
    });
  }
}
