import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_PROBATION_TRACKING_JOBS,
  type DayPulseJobData,
  type Day90ConfirmJobData,
} from '../types/probation-tracking.types';

/**
 * Schedules per-employee probation milestone jobs using Bull delays.
 */
@Injectable()
export class ProbationTrackingProducer {
  private readonly logger = new Logger(ProbationTrackingProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.JOB_PROBATION_TRACKING)
    private readonly probationQueue: Bull.Queue,
  ) {}

  private computeDelayMs(targetAt: Date, now: Date): number {
    const delayMs = targetAt.getTime() - now.getTime();
    return delayMs > 0 ? delayMs : 0;
  }

  // Enqueue Day30/Day60/Day90 jobs for an employee based on startDate.
  async scheduleEmployeeProbationMilestones(params: {
    employeeId: string;
    startDate: Date;
  }): Promise<void> {
    const now = new Date();

    const day30At = new Date(
      params.startDate.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    const day60At = new Date(
      params.startDate.getTime() + 60 * 24 * 60 * 60 * 1000,
    );
    const day90At = new Date(
      params.startDate.getTime() + 90 * 24 * 60 * 60 * 1000,
    );

    const day30Delay = this.computeDelayMs(day30At, now);
    const day60Delay = this.computeDelayMs(day60At, now);
    const day90Delay = this.computeDelayMs(day90At, now);

    // Use deterministic jobIds to reduce duplicate enqueues across retries.
    const day30JobId = `probation-${params.employeeId}-day30`;
    const day60JobId = `probation-${params.employeeId}-day60`;
    const day90JobId = `probation-${params.employeeId}-day90`;

    this.logger.log(
      `Scheduling probation milestones for ${params.employeeId} (day30DelayMs=${day30Delay}, day60DelayMs=${day60Delay}, day90DelayMs=${day90Delay})`,
    );

    const day30Job = this.probationQueue.add(
      JOB_PROBATION_TRACKING_JOBS.DAY30_PULSE,
      { employeeId: params.employeeId } satisfies DayPulseJobData,
      {
        jobId: day30JobId,
        delay: day30Delay,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    const day60Job = this.probationQueue.add(
      JOB_PROBATION_TRACKING_JOBS.DAY60_PULSE,
      { employeeId: params.employeeId } satisfies DayPulseJobData,
      {
        jobId: day60JobId,
        delay: day60Delay,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    const day90Job = this.probationQueue.add(
      JOB_PROBATION_TRACKING_JOBS.DAY90_CONFIRM,
      { employeeId: params.employeeId } satisfies Day90ConfirmJobData,
      {
        jobId: day90JobId,
        delay: day90Delay,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    await Promise.all([day30Job, day60Job, day90Job]).then(() => undefined);
  }
}

