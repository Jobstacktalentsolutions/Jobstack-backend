import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_POST_MATCH_NOTIFY_JOBS,
  type NotifyJobMatchesData,
} from '../types/job-post-match-notify.types';

/**
 * Enqueues background work to email jobseekers matched to a newly published job.
 */
@Injectable()
export class JobPostMatchNotifyProducer {
  private readonly logger = new Logger(JobPostMatchNotifyProducer.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.JOB_POST_MATCH_NOTIFY)
    private readonly queue: Queue,
  ) {}

  /** Queue match-notification emails for a published job (idempotent Bull job id per job). */
  async queueNotifyJobMatches(
    jobId: string,
  ): Promise<{ jobId: string | number }> {
    const job = await this.queue.add(
      JOB_POST_MATCH_NOTIFY_JOBS.NOTIFY_MATCHES,
      {
        jobId,
        triggeredAt: new Date().toISOString(),
      } as NotifyJobMatchesData,
      {
        priority: 2,
        removeOnComplete: true,
        removeOnFail: false,
        jobId: `job-post-match-${jobId}`,
      },
    );
    this.logger.log(`Queued job-post match notifications for job ${jobId}`);
    return { jobId: job.id };
  }
}
