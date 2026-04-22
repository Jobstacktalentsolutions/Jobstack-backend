import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuth } from '@app/common/database/entities';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { NotificationService } from '../../notification/notification.service';
import { ENV } from '../../config';

/**
 * Emails a vetting specialist (or super admin) when applicant count hits a multiple of 5.
 */
@Injectable()
export class JobVettingMilestoneNotifyService {
  private readonly logger = new Logger(JobVettingMilestoneNotifyService.name);

  constructor(
    @InjectRepository(AdminAuth)
    private readonly adminAuthRepo: Repository<AdminAuth>,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /** Picks a random active vetting specialist email, or falls back to super admin env email. */
  private async resolveRecipientEmail(): Promise<{
    to: string;
    firstName: string;
  }> {
    const specialists = await this.adminAuthRepo.find({
      where: {
        roleKey: AdminRole.VETTING_SPECIALIST.role,
        suspended: false,
      },
      relations: ['profile'],
    });

    if (specialists.length > 0) {
      const pick = specialists[Math.floor(Math.random() * specialists.length)];
      const firstName = pick.profile?.firstName?.trim() || 'there';
      return { to: pick.email, firstName };
    }

    const superEmail =
      this.configService.get<string>(ENV.SUPER_ADMIN_EMAIL) ?? '';
    return { to: superEmail, firstName: 'there' };
  }

  /**
   * If applicant count is a positive multiple of 5, emails one admin that vetting may be needed.
   */
  async notifyIfApplicantMilestone(
    jobId: string,
    jobTitle: string,
    applicantCount: number,
  ): Promise<void> {
    if (applicantCount <= 0 || applicantCount % 5 !== 0) {
      return;
    }

    const { to, firstName } = await this.resolveRecipientEmail();
    if (!to?.trim()) {
      this.logger.warn(
        'Vetting milestone: no vetting specialist and SUPER_ADMIN_EMAIL missing; skip email',
      );
      return;
    }

    const websiteUrl =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const actionUrl = websiteUrl
      ? `${websiteUrl}/admin/jobs/${jobId}/vetted-applicants`
      : '';

    const subject = `Vetting reminder: ${applicantCount} applicants on "${jobTitle}"`;
    const message = `Job "${jobTitle}" now has ${applicantCount} applicants (${applicantCount} is a multiple of 5). Please review and run vetting when ready so candidates can move forward.`;

    await this.notificationService.sendEmail({
      to: to.trim(),
      subject,
      template: 'general-notification',
      context: {
        subject,
        firstName,
        message,
        actionUrl: actionUrl || undefined,
        actionText: actionUrl ? 'Open vetted applicants' : undefined,
      },
    });

    this.logger.log(
      `Vetting milestone email queued for job ${jobId} (${applicantCount} applicants) → ${to}`,
    );
  }
}
