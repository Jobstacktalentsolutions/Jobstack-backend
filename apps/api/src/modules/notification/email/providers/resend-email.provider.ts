import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ENV } from 'apps/api/src/modules/config';
import { INotificationTransporter } from '../../notification.interface';
import { EmailPayloadDto } from '../email-notification.dto';

// Primary email transporter using the Resend HTTP API.
@Injectable()
export class ResendEmailProvider
  implements INotificationTransporter<EmailPayloadDto>
{
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>(ENV.RESEND_API_KEY) || '';
    this.fromEmail =
      this.configService.get<string>(ENV.RESEND_FROM_EMAIL) ||
      'noreply@jobstack.ng';
    this.fromName =
      this.configService.get<string>(ENV.RESEND_FROM_NAME) || 'JobStack';
  }

  // Sends one HTML message to `recipient` via Resend.
  async send(
    payload: EmailPayloadDto & { htmlContent?: string },
  ): Promise<void> {
    const { recipient, subject, htmlContent } = payload;

    if (!this.apiKey) {
      throw new Error('Resend API key is not configured');
    }

    const resend = new Resend(this.apiKey);
    const from = `${this.fromName} <${this.fromEmail}>`;

    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject: subject || 'Notification from JobStack',
      html: htmlContent ?? '',
    });

    if (error) {
      this.logger.error(`Failed to send email via Resend: ${error.message}`, {
        recipient,
        subject,
        code: error.name,
      });
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }

    this.logger.log('Email sent successfully via Resend', {
      recipient,
      subject,
      messageId: data?.id,
    });
  }

  // Ensures API key and from-address are configured.
  async healthCheck(): Promise<void> {
    if (!this.apiKey || !this.fromEmail) {
      throw new Error('Resend configuration incomplete');
    }
  }
}
