import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { QUEUE_NAMES } from '@app/common/queue';
import {
  JOB_POST_MATCH_NOTIFY_JOBS,
  type NotifyJobMatchesData,
} from '../types/job-post-match-notify.types';
import { JobPostMatchNotifyService } from '../services/job-post-match-notify.service';

/**
 * Processes published-job → matching jobseeker notification emails.
 */
@Processor(QUEUE_NAMES.JOB_POST_MATCH_NOTIFY)
@Injectable()
export class JobPostMatchNotifyConsumer {
  private readonly logger = new Logger(JobPostMatchNotifyConsumer.name);

  constructor(
    private readonly jobPostMatchNotifyService: JobPostMatchNotifyService,
  ) {}

  @Process(JOB_POST_MATCH_NOTIFY_JOBS.NOTIFY_MATCHES)
  async handleNotifyJobMatches(job: Job<NotifyJobMatchesData>) {
    const { jobId } = job.data;
    this.logger.log(`Processing match notifications for job ${jobId}`);
    return this.jobPostMatchNotifyService.processPublishedJobMatches(jobId);
  }
}
