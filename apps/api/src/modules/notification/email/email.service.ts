import { Inject, Injectable } from '@nestjs/common';
import type { EmailConfig, EmailPayloadDto } from './email-notification.dto';
import { BaseNotificationService } from '../base-notification.service';
import path from 'path';
import {
  EmailTemplateType,
  EMAIL_TYPE_CONFIG,
} from './email-notification.enum';
import { EMAIL_CONFIG, NOTIFICATION_PROVIDERS } from '../notification.config';
import type { INotificationTransporter } from '../notification.interface';
import * as ejs from 'ejs';

@Injectable()
export class EmailService extends BaseNotificationService<EmailPayloadDto> {
  private readonly templatesPath: string;

  constructor(
    @Inject(NOTIFICATION_PROVIDERS.EMAIL)
    private readonly emailProviders: INotificationTransporter<EmailPayloadDto>[],
    @Inject(EMAIL_CONFIG)
    private readonly emailConfig: EmailConfig,
  ) {
    super();
    this.templatesPath = path.join(
      process.cwd(),
      'apps/api/src/templates/emails',
    );
  }

  async send(payload: EmailPayloadDto): Promise<void> {
    const recipientDomain = (payload.recipient || '')
      .trim()
      .toLowerCase()
      .split('@')
      .pop();

    // Test users: never send real emails to example.com
    if (recipientDomain && recipientDomain.endsWith('example.com')) {
      this.logger.log('Skipping email send for test user', {
        recipient: payload.recipient,
        templateType: payload.templateType,
      });
      return;
    }

    let htmlContent = payload.htmlContent;

    // Render template if templateType is provided and no htmlContent exists
    if (payload.templateType && !htmlContent) {
      htmlContent = await this.renderTemplate(
        payload.templateType as EmailTemplateType,
        payload.context,
      );
    }

    const contextSubject =
      typeof payload.context?.subject === 'string'
        ? payload.context.subject
        : undefined;
    const finalSubject =
      payload.subject ||
      contextSubject ||
      (payload.templateType
        ? EMAIL_TYPE_CONFIG[payload.templateType as EmailTemplateType]?.subject
        : null) ||
      'Notification from JobStack';

    const enhancedPayload = { ...payload, htmlContent, subject: finalSubject };

    await this.sendWithProviderFallback(
      this.emailProviders,
      (provider) => provider.send(enhancedPayload),
      {
        recipient: payload.recipient,
        templateType: payload.templateType,
        finalSubject,
        htmlLength: htmlContent?.length || 0,
        notificationType: 'Email',
      },
    );
  }

  /** Build template-specific default context so EJS never sees undefined vars (avoids || in templates). */
  private getDefaultContextForTemplate(
    templateType: EmailTemplateType,
    context: Record<string, unknown>,
  ): Record<string, unknown> {
    const c: Record<string, unknown> = context || {};
    const defaults: Record<string, unknown> = {};
    switch (templateType) {
      case EmailTemplateType.PASSWORD_RESET:
        defaults.expiryMinutes = c.expiryMinutes ?? 15;
        break;
      case EmailTemplateType.EMAIL_VERIFICATION:
        defaults.expiryMinutes = c.expiryMinutes ?? 10;
        break;
      case EmailTemplateType.JOB_APPLICATION_RECEIVED:
      case EmailTemplateType.JOB_APPLICATION_STATUS:
      case EmailTemplateType.NEW_JOB_POSTED:
      case EmailTemplateType.INTERVIEW_SCHEDULED:
        defaults.recipientName =
          c.firstName ?? c.name ?? (c.recipientName as string) ?? 'there';
        if (templateType === EmailTemplateType.JOB_APPLICATION_RECEIVED) {
          defaults.viewApplicationUrl = c.applicationUrl ?? c.actionUrl ?? '';
        }
        break;
      case EmailTemplateType.JOB_MATCH_RECOMMENDATION:
        defaults.recipientName =
          c.firstName ?? c.name ?? (c.recipientName as string) ?? 'there';
        // Absolute URL to jobseeker job detail (apply flow lives on this page)
        defaults.jobDetailUrl =
          (c.jobDetailUrl as string) ?? (c.jobUrl as string) ?? '';
        break;
      case EmailTemplateType.URGENT_JOB_MATCH_ALERT:
        defaults.adminName = c.adminName ?? 'Admin';
        defaults.jobTitle = c.jobTitle ?? '';
        defaults.jobUrl = c.jobUrl ?? '';
        defaults.reason = c.reason ?? 'No matching candidates were found.';
        break;
      case EmailTemplateType.JOB_ACTIVATED_EMPLOYER:
        defaults.firstName =
          (c.firstName as string) ?? (c.employerFirstName as string) ?? 'there';
        defaults.jobTitle = (c.jobTitle as string) ?? '';
        defaults.jobDashboardUrl = (c.jobDashboardUrl as string) ?? '';
        defaults.actionUrl =
          (c.actionUrl as string) ?? (defaults.jobDashboardUrl as string) ?? '';
        defaults.actionText = (c.actionText as string) ?? 'View your job post';
        break;
      case EmailTemplateType.JOBSEEKER_WELCOME:
      case EmailTemplateType.EMPLOYER_WELCOME:
        defaults.firstName = c.firstName ?? 'there';
        defaults.actionUrl =
          (c.actionUrl as string) ??
          (templateType === EmailTemplateType.JOBSEEKER_WELCOME
            ? `${this.emailConfig.websiteUrl.replace(/\/$/, '')}/jobseeker/dashboard/explore-jobs`
            : `${this.emailConfig.websiteUrl.replace(/\/$/, '')}/employer/dashboard/jobposts`);
        break;
      case EmailTemplateType.GENERAL_NOTIFICATION:
        defaults.firstName = c.firstName ?? 'there';
        defaults.title = c.title ?? c.subject ?? '';
        break;
      case EmailTemplateType.CANDIDATE_SELECTED_FOR_SCREENING:
      case EmailTemplateType.INTERVIEW_SCHEDULED:
      case EmailTemplateType.EMPLOYER_SCREENING_INVITATION:
        defaults.interviewLocation = this.inferInterviewLocation(
          (c.meetingLink as string) ??
            (c.screeningMeetingLink as string) ??
            '',
        );
        break;
      case EmailTemplateType.JOBSEEKER_ONBOARDING_REVIEW:
        defaults.firstName = c.firstName ?? 'there';
        defaults.actionText = c.actionText ?? 'Explore jobs';
        break;
      case EmailTemplateType.EMPLOYER_ONBOARDING_REVIEW:
        defaults.firstName = c.firstName ?? 'there';
        defaults.actionText = c.actionText ?? 'Draft a job post';
        break;
      default:
        break;
    }
    return defaults;
  }

  private inferInterviewLocation(meetingLink: string): string {
    if (!meetingLink?.trim()) {
      return 'Virtual meeting';
    }

    try {
      const hostname = new URL(meetingLink).hostname
        .toLowerCase()
        .replace(/^www\./, '');

      if (hostname.includes('meet.google')) return 'Google Meet';
      if (hostname.includes('zoom')) return 'Zoom';
      if (hostname.includes('teams.microsoft')) return 'Microsoft Teams';
      if (hostname.includes('meet.jit') || hostname.includes('jitsi'))
        return 'Jitsi Meet';
      if (hostname.includes('webex')) return 'Cisco Webex';

      const titleCased = hostname
        .split('.')
        .slice(0, -1)
        .filter(Boolean)
        .map((segment) =>
          segment
            .split('-')
            .map(
              (part) => part.charAt(0).toUpperCase() + part.slice(1),
            )
            .join(' '),
        )
        .join(' ');

      return titleCased || 'Virtual meeting';
    } catch {
      return 'Virtual meeting';
    }
  }

  private assertRequiredContext(
    templateType: EmailTemplateType,
    context: Record<string, unknown>,
  ): void {
    const requiredKeysByTemplate: Partial<Record<EmailTemplateType, string[]>> =
      {
        [EmailTemplateType.JOBSEEKER_ONBOARDING_REVIEW]: [
          'firstName',
          'message',
          'actionText',
          'actionUrl',
          'dashboardUrl',
        ],
        [EmailTemplateType.EMPLOYER_ONBOARDING_REVIEW]: [
          'firstName',
          'message',
          'actionText',
          'actionUrl',
          'dashboardUrl',
        ],
      };

    const requiredKeys = requiredKeysByTemplate[templateType] ?? [];
    const missingKeys = requiredKeys.filter((key) => {
      const value = context[key];
      return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0)
      );
    });

    if (missingKeys.length > 0) {
      throw new Error(
        `Missing required email context for ${templateType}: ${missingKeys.join(', ')}`,
      );
    }
  }

  async renderTemplate<T extends EmailTemplateType>(
    templateType: T,
    context: Record<string, unknown>,
  ): Promise<string> {
    const templateConfig = EMAIL_TYPE_CONFIG[templateType];
    if (!templateConfig) {
      throw new Error(`Unknown email template type: ${templateType}`);
    }

    const templatePath = path.join(this.templatesPath, templateConfig.template);

    const templateDefaults = this.getDefaultContextForTemplate(
      templateType,
      context,
    );
    const enhancedContext = {
      subject: templateConfig.subject,
      ...templateDefaults,
      ...context,
      companyName: this.emailConfig.companyName,
      supportEmail: this.emailConfig.supportEmail,
      websiteUrl: this.emailConfig.websiteUrl,
      currentYear: new Date().getFullYear(),
    };

    this.assertRequiredContext(templateType, enhancedContext);

    try {
      return await ejs.renderFile(templatePath, enhancedContext, {
        async: true,
        root: this.templatesPath,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      this.logger.error(
        `Failed to render email template ${templateType}: ${message}`,
      );
      throw new Error(`Email template rendering failed: ${message}`);
    }
  }
}
