import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from '@app/common/database/entities';
import { JobStatus } from '@app/common/database/entities/schema.enum';
import { NotificationService } from '../../notification/notification.service';
import { EmailTemplateType } from '../../notification/email/email-notification.enum';
import { ENV } from '../../config';

/**
 * Side effects when a job becomes ACTIVE (admin activation after publish, or employer go-live flow).
 */
@Injectable()
export class JobActivationService {
  private readonly logger = new Logger(JobActivationService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Queues a casual “your job is live” email to the employer; non-blocking (fire-and-forget).
   */
  queueEmployerActivationEmail(job: Job, previousStatus: JobStatus): void {
    if (
      job.status !== JobStatus.ACTIVE ||
      previousStatus === JobStatus.ACTIVE
    ) {
      return;
    }
    const employerEmail = job.employer?.email?.trim();
    if (!employerEmail) {
      this.logger.debug(
        `Skip activation email for job ${job.id}: employer has no email`,
      );
      return;
    }

    void this.sendEmployerActivationEmail(job, employerEmail).catch((err) =>
      this.logger.warn(
        `Employer activation email failed for job ${job.id}: ${err?.message ?? err}`,
      ),
    );
  }

  /** Sends job-activated template with dashboard link to manage the post. */
  private async sendEmployerActivationEmail(
    job: Job,
    employerEmail: string,
  ): Promise<void> {
    const baseUrl =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const jobDashboardUrl = baseUrl
      ? `${baseUrl}/employer/dashboard/jobposts/${job.id}`
      : '';
    const firstName = job.employer?.firstName?.trim() || 'there';
    const subject = `You're live — "${job.title}" is now active`;

    await this.notificationService.sendEmail({
      to: employerEmail,
      subject,
      template: EmailTemplateType.JOB_ACTIVATED_EMPLOYER,
      context: {
        subject,
        firstName,
        employerFirstName: firstName,
        jobTitle: job.title,
        jobId: job.id,
        jobDashboardUrl,
        actionUrl: jobDashboardUrl || undefined,
        actionText: jobDashboardUrl ? 'View your job post' : undefined,
      },
    });

    this.logger.log(`Queued employer activation email for job ${job.id}`);
  }
}
