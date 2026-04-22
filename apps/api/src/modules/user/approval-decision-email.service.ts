import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JobSeekerProfile,
  EmployerProfile,
} from '@app/common/database/entities';
import { ApprovalStatus } from '@app/common/database/entities/schema.enum';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import { JobseekerVerificationDocumentKind } from '@app/common/shared/enums/jobseeker-docs.enum';
import { NotificationService } from '../notification/notification.service';
import { ENV } from '../config';

/**
 * Queues transactional emails when employer verification or jobseeker approval decisions change.
 */
@Injectable()
export class ApprovalDecisionEmailService {
  private readonly logger = new Logger(ApprovalDecisionEmailService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Employer: email when verification becomes APPROVED or REJECTED (both paths;
   * skips duplicate if status was already the same).
   */
  queueEmployerVerificationEmail(
    employer: EmployerProfile,
    previousStatus: VerificationStatus,
    newStatus: VerificationStatus,
    rejectionReason?: string,
  ): void {
    const isApproved = newStatus === VerificationStatus.APPROVED;
    const isRejected = newStatus === VerificationStatus.REJECTED;
    if (!isApproved && !isRejected) {
      return;
    }
    if (newStatus === previousStatus) {
      return;
    }

    const to = employer.auth?.email ?? employer.email;
    if (!to?.trim()) {
      return;
    }

    const base =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const jobPostsUrl = base ? `${base}/employer/dashboard/jobposts` : '';
    const homeUrl = base ? `${base}/employer/dashboard` : '';
    const firstName = employer.firstName?.trim() || 'there';

    let subject: string;
    let message: string;
    let actionText: string | undefined;
    let actionUrl: string | undefined;

    if (isApproved) {
      subject = 'Your company verification is approved';
      message = `Hi ${firstName}, good news — your employer verification on JobStack is approved. You can post roles and connect with pre-vetted talent whenever you're ready. Sit back for a moment if you like; your dashboard is ready when you are.`;
      actionText = jobPostsUrl ? 'Open job posts' : undefined;
      actionUrl = jobPostsUrl || undefined;
    } else if (isRejected) {
      subject = 'Update on your employer verification';
      const reasonNote = rejectionReason?.trim()
        ? ` Here's a note from our team: ${rejectionReason.trim()}`
        : '';
      message = `Hi ${firstName}, we reviewed your verification and it wasn't approved this time.${reasonNote} You can update your details in the dashboard and resubmit when you're ready.`;
      actionText = homeUrl ? 'Open dashboard' : undefined;
      actionUrl = homeUrl || undefined;
    }

    void this.notificationService
      .sendEmail({
        to: to.trim(),
        subject,
        template: 'general-notification',
        context: {
          subject,
          firstName,
          message,
          actionText,
          actionUrl,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Employer verification email failed for ${to}: ${err?.message ?? err}`,
        ),
      );
  }

  /**
   * Jobseeker: email when approval becomes APPROVED or REJECTED (both paths;
   * skips duplicate if status was already the same).
   */
  queueJobseekerApprovalEmail(
    profile: JobSeekerProfile,
    previousStatus: ApprovalStatus,
    newStatus: ApprovalStatus,
    rejectionReason?: string,
  ): void {
    const isApproved = newStatus === ApprovalStatus.APPROVED;
    const isRejected = newStatus === ApprovalStatus.REJECTED;
    if (!isApproved && !isRejected) {
      return;
    }
    if (newStatus === previousStatus) {
      return;
    }

    const to = profile.email;
    if (!to?.trim()) {
      return;
    }

    const base =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const exploreUrl = base ? `${base}/jobseeker/dashboard/explore-jobs` : '';
    const dashboardUrl = base ? `${base}/jobseeker/dashboard` : '';
    const firstName = profile.firstName?.trim() || 'there';
    const reasonText =
      rejectionReason?.trim() || profile.approvalRejectionReason?.trim() || '';

    let subject: string;
    let message: string;
    let actionText: string | undefined;
    let actionUrl: string | undefined;

    if (isApproved) {
      subject = 'Your JobStack profile is approved';
      message = `Hi ${firstName}, you're all set — your profile has been approved. You can browse open roles and apply when something fits. Take your time exploring; we'll keep matching you with opportunities.`;
      actionText = exploreUrl ? 'Browse jobs' : undefined;
      actionUrl = exploreUrl || undefined;
    } else if (isRejected) {
      subject = 'Update on your profile review';
      const reasonNote = reasonText ? ` Note from our team: ${reasonText}` : '';
      message = `Hi ${firstName}, your profile review didn't go through this time.${reasonNote} You can update your profile and documents in the app and we'll take another look.`;
      actionText = dashboardUrl ? 'Review your profile' : undefined;
      actionUrl = dashboardUrl || undefined;
    }

    void this.notificationService
      .sendEmail({
        to: to.trim(),
        subject,
        template: 'general-notification',
        context: {
          subject,
          firstName,
          message,
          actionText,
          actionUrl,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Jobseeker approval email failed for ${to}: ${err?.message ?? err}`,
        ),
      );
  }

  /** Notify employer when a specific verification document is rejected. */
  queueEmployerVerificationDocumentRejectedEmail(
    employer: EmployerProfile,
    documentTypeLabel: string,
    rejectionReason: string,
  ): void {
    const to = employer.auth?.email ?? employer.email;
    if (!to?.trim() || !rejectionReason?.trim()) {
      return;
    }

    const base =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const homeUrl = base ? `${base}/employer/dashboard` : '';
    const firstName = employer.firstName?.trim() || 'there';

    const subject = 'Action needed: verification document update';
    const message = `Hi ${firstName}, we reviewed your ${documentTypeLabel} and couldn't accept it this time. Reason: ${rejectionReason.trim()} Please upload a replacement from your dashboard.`;

    void this.notificationService
      .sendEmail({
        to: to.trim(),
        subject,
        template: 'general-notification',
        context: {
          subject,
          firstName,
          message,
          actionText: homeUrl ? 'Open dashboard' : undefined,
          actionUrl: homeUrl || undefined,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Employer document rejection email failed for ${to}: ${err?.message ?? err}`,
        ),
      );
  }

  /** Notify jobseeker when a specific verification document is rejected. */
  queueJobseekerVerificationDocumentRejectedEmail(
    profile: JobSeekerProfile,
    documentKind: JobseekerVerificationDocumentKind,
    rejectionReason: string,
  ): void {
    const to = profile.email;
    if (!to?.trim() || !rejectionReason?.trim()) {
      return;
    }

    const base =
      this.configService.get<string>(ENV.WEBSITE_URL)?.replace(/\/$/, '') ?? '';
    const dashboardUrl = base ? `${base}/jobseeker/dashboard` : '';
    const firstName = profile.firstName?.trim() || 'there';
    const kindLabel =
      documentKind === JobseekerVerificationDocumentKind.ID_DOCUMENT
        ? 'identity document'
        : String(documentKind).replace(/_/g, ' ').toLowerCase();

    const subject = 'Action needed: update your verification document';
    const message = `Hi ${firstName}, we reviewed your ${kindLabel} and couldn't accept it this time. Reason: ${rejectionReason.trim()} Please upload a replacement from your profile.`;

    void this.notificationService
      .sendEmail({
        to: to.trim(),
        subject,
        template: 'general-notification',
        context: {
          subject,
          firstName,
          message,
          actionText: dashboardUrl ? 'Open dashboard' : undefined,
          actionUrl: dashboardUrl || undefined,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Jobseeker document rejection email failed for ${to}: ${err?.message ?? err}`,
        ),
      );
  }
}
