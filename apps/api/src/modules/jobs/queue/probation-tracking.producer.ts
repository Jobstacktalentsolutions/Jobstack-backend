import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_PROBATION_TRACKING_JOBS,
  type ProbationReminderJobData,
  type ProbationConfirmJobData,
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

  // Enqueue one reminder and one auto-confirm job for an employee.
  async scheduleEmployeeProbationMilestones(params: {
    employeeId: string;
    reminderAt: Date;
    confirmAt: Date;
  }): Promise<void> {
    const now = new Date();

    const reminderDelay = this.computeDelayMs(params.reminderAt, now);
    const confirmDelay = this.computeDelayMs(params.confirmAt, now);

    // Use deterministic jobIds to reduce duplicate enqueues across retries.
    const reminderJobId = `probation-${params.employeeId}-reminder`;
    const confirmJobId = `probation-${params.employeeId}-confirm`;

    this.logger.log(
      `Scheduling probation milestones for ${params.employeeId} (reminderDelayMs=${reminderDelay}, confirmDelayMs=${confirmDelay})`,
    );

    const reminderJob = this.probationQueue.add(
      JOB_PROBATION_TRACKING_JOBS.PROBATION_REMINDER,
      { employeeId: params.employeeId } satisfies ProbationReminderJobData,
      {
        jobId: reminderJobId,
        delay: reminderDelay,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    const confirmJob = this.probationQueue.add(
      JOB_PROBATION_TRACKING_JOBS.PROBATION_CONFIRM,
      { employeeId: params.employeeId } satisfies ProbationConfirmJobData,
      {
        jobId: confirmJobId,
        delay: confirmDelay,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    await Promise.all([reminderJob, confirmJob]).then(() => undefined);
  }
}
