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
import { EmailTemplateType } from '../notification/email/email-notification.enum';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { NotificationPriority } from '@app/common/database/entities/schema.enum';

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

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return JSON.stringify(error);
  }

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
      message = `Hi ${firstName}, good news - your employer verification on JobStack is approved. You can post roles and connect with pre-vetted talent whenever you're ready.`;
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
          `Employer verification email failed for ${to}: ${this.describeError(err)}`,
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
          `Jobseeker approval email failed for ${to}: ${this.describeError(err)}`,
        ),
      );
  }

  queueJobseekerOnboardingReviewEmail(profile: JobSeekerProfile): void {
    const to = profile.email;
    if (!to?.trim()) {
      return;
    }

    const base = this.configService
      .getOrThrow<string>(ENV.WEBSITE_URL)
      .replace(/\/$/, '');
    const exploreUrl = `${base}/jobseeker/dashboard/explore-jobs`;
    const dashboardUrl = `${base}/jobseeker/dashboard`;
    const firstName = profile.firstName?.trim() || 'there';

    const subject = 'Your profile is in review';
    const message =
      'Thanks for completing your onboarding. We are reviewing your profile now and should approve it shortly. For now, you can explore jobs, bookmark anything that stands out, and come back when you are ready to apply.';

    void this.notificationService
      .sendEmail({
        to: to.trim(),
        subject,
        template: EmailTemplateType.JOBSEEKER_ONBOARDING_REVIEW,
        context: {
          subject,
          firstName,
          message,
          actionText: 'Explore jobs',
          actionUrl: exploreUrl,
          dashboardUrl,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Jobseeker onboarding review email failed for ${to}: ${this.describeError(err)}`,
        ),
      );

    void this.notificationService.createAppNotification(
      profile.id,
      UserRole.JOB_SEEKER,
      {
        title: 'Profile in review',
        message:
          'We are reviewing your profile now. You can explore and bookmark jobs while you wait.',
        priority: NotificationPriority.HIGH,
        templateType: EmailTemplateType.JOBSEEKER_ONBOARDING_REVIEW,
        templateContext: {
          dashboardUrl,
          exploreJobsUrl: exploreUrl,
        },
      },
    );
  }

  queueEmployerOnboardingReviewEmail(employer: EmployerProfile): void {
    const to = employer.auth?.email ?? employer.email;
    if (!to?.trim()) {
      return;
    }

    const base = this.configService
      .getOrThrow<string>(ENV.WEBSITE_URL)
      .replace(/\/$/, '');
    const dashboardUrl = `${base}/employer/dashboard`;
    const draftJobUrl = `${base}/employer/dashboard/jobs/post-job`;
    const firstName = employer.firstName?.trim() || 'there';

    const subject = 'Your employer profile is in review';
    const message =
      'Thanks for completing your onboarding. We are reviewing your employer profile now and should approve it shortly. In the meantime, you can draft job posts and prepare them for publishing once approval comes through.';

    void this.notificationService
      .sendEmail({
        to: to.trim(),
        subject,
        template: EmailTemplateType.EMPLOYER_ONBOARDING_REVIEW,
        context: {
          subject,
          firstName,
          message,
          actionText: 'Draft a job post',
          actionUrl: draftJobUrl,
          dashboardUrl,
        },
      })
      .catch((err) =>
        this.logger.warn(
          `Employer onboarding review email failed for ${to}: ${this.describeError(err)}`,
        ),
      );

    void this.notificationService.createAppNotification(
      employer.id,
      UserRole.EMPLOYER,
      {
        title: 'Profile in review',
        message:
          'We are reviewing your employer profile now. You can draft job posts while you wait.',
        priority: NotificationPriority.HIGH,
        templateType: EmailTemplateType.EMPLOYER_ONBOARDING_REVIEW,
        templateContext: {
          dashboardUrl,
          draftJobUrl,
        },
      },
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
          `Employer document rejection email failed for ${to}: ${this.describeError(err)}`,
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
          `Jobseeker document rejection email failed for ${to}: ${this.describeError(err)}`,
        ),
      );
  }
}
