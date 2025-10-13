import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { INotificationTransporter } from '../../notification.interface';
import { EmailPayloadDto } from '../email-notification.dto';
import { ENV } from 'apps/api/src/modules/config';

@Injectable()
export class ResendEmailProvider
  implements INotificationTransporter<EmailPayloadDto>
{
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>(ENV.RESEND_API_KEY);

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required but not configured');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>(ENV.RESEND_FROM_EMAIL) ||
      'noreply@jobstack.ng';
    this.fromName =
      this.configService.get<string>(ENV.RESEND_FROM_NAME) || 'JobStack';
  }

  async send(
    payload: EmailPayloadDto & { htmlContent: string },
  ): Promise<void> {
    const { recipient, subject, htmlContent } = payload;

    try {
      const response = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [recipient],
        subject: subject || 'Notification from JobStack',
        html: htmlContent,
      });

      console.log('Email sent successfully via Resend', {
        recipient,
        subject,
        messageId: response.data?.id,
      });
    } catch (error: any) {
      console.error('Failed to send email via Resend', error);
      throw new Error(
        `Failed to send email via Resend: ${
          error?.message || 'Unknown error occurred'
        }`,
      );
    }
  }

  // Health check method to verify configuration
  async healthCheck(): Promise<void> {
    if (!this.fromEmail) {
      throw new Error('Resend configuration incomplete: fromEmail is required');
    }
  }
}
