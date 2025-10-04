import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { INotificationTransporter } from '../../notification.interface';
import { EmailPayloadDto } from '../email-notification.dto';

@Injectable()
export class ResendEmailProvider
  implements INotificationTransporter<EmailPayloadDto>
{
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required but not configured');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'noreply@jobstack.ng';
    this.fromName =
      this.configService.get<string>('RESEND_FROM_NAME') || 'JobStack';
  }

  async send(
    payload: EmailPayloadDto & { htmlContent?: string },
  ): Promise<void> {
    const { recipient, subject, htmlContent } = payload;

    try {
      const response = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [recipient],
        subject: subject || 'Notification from JobStack',
        html: htmlContent || this.generateFallbackHtml(payload),
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

  // Generate fallback HTML content when no template is provided
  private generateFallbackHtml(payload: EmailPayloadDto): string {
    return `
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${payload.subject || 'Notification from JobStack'}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50; margin-bottom: 20px;">${payload.subject || 'Notification from JobStack'}</h2>
            <p>Hello,</p>
            <p>You have received a notification from JobStack.</p>
            <p>Best regards,<br>JobStack Team</p>
          </div>
        </body>
      </html>
    `;
  }

  // Health check method to verify configuration
  async healthCheck(): Promise<void> {
    if (!this.fromEmail) {
      throw new Error('Resend configuration incomplete: fromEmail is required');
    }
  }
}
