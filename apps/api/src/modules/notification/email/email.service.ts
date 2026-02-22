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
    let htmlContent = payload.htmlContent;

    // Render template if templateType is provided and no htmlContent exists
    if (payload.templateType && !htmlContent) {
      htmlContent = await this.renderTemplate(
        payload.templateType as EmailTemplateType,
        payload.context,
      );
    }

    const finalSubject =
      payload.subject ||
      payload.context?.subject ||
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
    const c = context || {};
    const defaults: Record<string, unknown> = {};
    switch (templateType) {
      case EmailTemplateType.PASSWORD_RESET:
        defaults.firstName = c.firstName ?? 'there';
        defaults.expiryMinutes = c.expiryMinutes ?? 15;
        break;
      case EmailTemplateType.EMAIL_VERIFICATION:
        defaults.firstName = c.firstName ?? 'there';
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
      case EmailTemplateType.WELCOME:
        defaults.firstName = c.firstName ?? 'there';
        defaults.userType = c.userType ?? 'jobseeker';
        break;
      case EmailTemplateType.GENERAL_NOTIFICATION:
        defaults.firstName = c.firstName ?? 'there';
        break;
      default:
        break;
    }
    return defaults;
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
      templateType as EmailTemplateType,
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

    try {
      return await ejs.renderFile(templatePath, enhancedContext, {
        async: true,
        root: this.templatesPath,
      });
    } catch (error) {
      this.logger.error(
        `Failed to render email template ${templateType}: ${error.message}`,
      );
      throw new Error(`Email template rendering failed: ${error.message}`);
    }
  }
}
