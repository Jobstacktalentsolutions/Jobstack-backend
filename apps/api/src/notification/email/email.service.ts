import { Inject, Injectable } from '@nestjs/common';
import type { EmailConfig, EmailPayloadDto } from './email-notification.dto';
import { BaseNotificationService } from '../base-notification.service';
import path from 'path';
import { EmailTemplateType, EMAIL_TYPE_CONFIG } from './email-notification.enum';
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
    private readonly emailConfig: EmailConfig
  ) {
    super();
    this.templatesPath = path.join(
      process.cwd(),
      'apps/api/src/templates/emails'
    );
  }

  async send(payload: EmailPayloadDto): Promise<void> {
    let htmlContent = payload.htmlContent;
    
    // Render template if templateType is provided and no htmlContent exists
    if (payload.templateType && !htmlContent) {
      htmlContent = await this.renderTemplate(
        payload.templateType as EmailTemplateType,
        payload.context
      );
    }

    const finalSubject =
      payload.subject || 
      payload.context?.subject || 
      (payload.templateType ? EMAIL_TYPE_CONFIG[payload.templateType as EmailTemplateType]?.subject : null) ||
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
      }
    );
  }

  async renderTemplate<T extends EmailTemplateType>(
    templateType: T,
    context: any
  ): Promise<string> {
    const templateConfig = EMAIL_TYPE_CONFIG[templateType];
    if (!templateConfig) {
      throw new Error(`Unknown email template type: ${templateType}`);
    }

    const templatePath = path.join(this.templatesPath, templateConfig.template);

    const enhancedContext = {
      subject: templateConfig.subject,
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
      this.logger.error(`Failed to render email template ${templateType}: ${error.message}`);
      // Return a fallback template
      return this.generateFallbackTemplate(templateType, enhancedContext);
    }
  }

  private generateFallbackTemplate(templateType: EmailTemplateType, context: any): string {
    const config = EMAIL_TYPE_CONFIG[templateType];
    return `
      <html>
        <head>
          <title>${config.subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">${config.subject}</h2>
            <p>Hello ${context.firstName || context.name || ''},</p>
            <p>You have received a notification from ${context.companyName || 'JobStack'}.</p>
            ${context.message ? `<p>${context.message}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              Best regards,<br>
              ${context.companyName || 'JobStack'} Team<br>
              <a href="${context.websiteUrl || '#'}">${context.websiteUrl || 'jobstack.ng'}</a>
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
