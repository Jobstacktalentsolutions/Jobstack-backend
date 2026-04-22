import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '@app/common/database/entities';
import { NotificationService } from '../../notification/notification.service';
import { ENV } from '../../config';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { NotificationPriority } from '@app/common/database/entities/schema.enum';

/**
 * Notifies the job's employer when applicant count hits a multiple of 5,
 * prompting them to review candidates.
 * Previously notified admin vetting specialists; employers now own the pipeline.
 */
@Injectable()
export class JobVettingMilestoneNotifyService {
  private readonly logger = new Logger(JobVettingMilestoneNotifyService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * If applicant count is a positive multiple of 5, notifies the employer that
   * they may want to review and vet the growing candidate pool.
   */
  async notifyIfApplicantMilestone(
    jobId: string,
    jobTitle: string,
    applicantCount: number,
  ): Promise<void> {
    if (applicantCount <= 0 || applicantCount % 5 !== 0) {
      return;
    }

    // Fetch job with employer relation to get contact details
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['employer'],
    });

    if (!job?.employer?.email) {
      this.logger.warn(
        `Vetting milestone: job ${jobId} has no employer email; skipping notification`,
      );
      return;
    }

    const websiteUrl =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const actionUrl = websiteUrl
      ? `${websiteUrl}/employer/dashboard/jobs/${jobId}/candidates`
      : '';

    const firstName = job.employer.firstName?.trim() || 'there';
    const subject = `New applicants on "${jobTitle}" — ${applicantCount} total`;
    const message = `Your job "${jobTitle}" now has ${applicantCount} applicants. Review and rank candidates whenever you're ready.`;

    // Email the employer
    await this.notificationService.sendEmail({
      to: job.employer.email,
      subject,
      template: 'general-notification',
      context: {
        subject,
        firstName,
        message,
        actionUrl: actionUrl || undefined,
        actionText: actionUrl ? 'Review Candidates' : undefined,
      },
    });

    // Also send an in-app notification
    try {
      await this.notificationService.createAppNotification(
        job.employerId,
        UserRole.EMPLOYER,
        {
          title: `📬 ${applicantCount} applicants on "${jobTitle}"`,
          message,
          priority: NotificationPriority.MEDIUM,
          metadata: { jobId, applicantCount },
        },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to create in-app milestone notification for employer: ${err.message}`,
      );
    }

    this.logger.log(
      `Milestone notification sent to employer for job ${jobId} (${applicantCount} applicants)`,
    );
  }
}
