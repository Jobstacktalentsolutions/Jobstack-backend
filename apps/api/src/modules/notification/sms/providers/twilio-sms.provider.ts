import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { INotificationTransporter } from '../../notification.interface';
import type { SmsPayloadDto } from '../sms-notification.dto';
import twilio from 'twilio';
import { ENV } from '@app/common/config/env.config';

@Injectable()
export class TwilioSmsProvider
  implements INotificationTransporter<SmsPayloadDto>
{
  private readonly client: ReturnType<typeof twilio>;
  private readonly fromNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>(ENV.TWILIO_ACCOUNT_SID);
    const authToken = this.configService.get<string>(ENV.TWILIO_AUTH_TOKEN);
    this.fromNumber = this.configService.get<string>(
      ENV.TWILIO_FROM_NUMBER,
    ) as string;

    if (!accountSid || !authToken || !this.fromNumber) {
      throw new Error('Twilio configuration is missing required values');
    }

    this.client = twilio(accountSid, authToken);
  }

  // Send SMS using Twilio
  async send(payload: SmsPayloadDto): Promise<void> {
    await this.client.messages.create({
      to: payload.recipient,
      from: this.fromNumber,
      body: payload.body,
    });
  }
}
