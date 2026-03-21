import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_PROBATION_TRACKING_JOBS,
  type DayPulseJobData,
  type Day90ConfirmJobData,
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

  @Process(JOB_PROBATION_TRACKING_JOBS.DAY30_PULSE)
  async handleDay30Pulse(job: Job<DayPulseJobData>): Promise<void> {
    const { employeeId } = job.data;
    this.logger.log(`Day30 pulse job for employee ${employeeId}`);
    await this.probationTrackingService.sendDay30Pulse(employeeId);
  }

  @Process(JOB_PROBATION_TRACKING_JOBS.DAY60_PULSE)
  async handleDay60Pulse(job: Job<DayPulseJobData>): Promise<void> {
    const { employeeId } = job.data;
    this.logger.log(`Day60 pulse job for employee ${employeeId}`);
    await this.probationTrackingService.sendDay60Pulse(employeeId);
  }

  @Process(JOB_PROBATION_TRACKING_JOBS.DAY90_CONFIRM)
  async handleDay90Confirm(job: Job<Day90ConfirmJobData>): Promise<void> {
    const { employeeId } = job.data;
    this.logger.log(`Day90 confirm job for employee ${employeeId}`);
    await this.probationTrackingService.confirmProbationDay90(employeeId);
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

