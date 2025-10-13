import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ENV } from 'apps/api/src/modules/config';
import { INotificationTransporter } from '../../notification.interface';
import { EmailPayloadDto } from '../email-notification.dto';

@Injectable()
export class BrevoEmailProvider
  implements INotificationTransporter<EmailPayloadDto>
{
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly baseUrl: string = 'https://api.brevo.com/v3';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>(ENV.BREVO_API_KEY) || '';
    this.fromEmail =
      this.configService.get<string>(ENV.BREVO_FROM_EMAIL) ||
      'noreply@jobstack.ng';
    this.fromName =
      this.configService.get<string>(ENV.BREVO_FROM_NAME) || 'JobStack';
  }

  async send(
    payload: EmailPayloadDto & { htmlContent?: string },
  ): Promise<void> {
    const { recipient, subject, htmlContent } = payload;

    if (!this.apiKey) {
      throw new Error('Brevo API key is not configured');
    }

    const requestBody = {
      sender: { email: this.fromEmail, name: this.fromName },
      to: [{ email: recipient }],
      subject: subject || 'Notification from JobStack',
      htmlContent: htmlContent,
    };

    try {
      const response = await axios.post(
        `${this.baseUrl}/smtp/email`,
        requestBody,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
          timeout: 10000,
        },
      );

      console.log('Email sent successfully via Brevo', {
        recipient,
        subject,
        messageId: response.data.messageId,
      });
    } catch (error: any) {
      console.error('Failed to send email via Brevo', error);
      throw new Error(
        `Failed to send email via Brevo: ${
          error?.response?.data?.message || error.message
        }`,
      );
    }
  }

  async healthCheck(): Promise<void> {
    if (!this.apiKey || !this.fromEmail) {
      throw new Error('Brevo configuration incomplete');
    }
  }
}
