import { Inject, Injectable } from '@nestjs/common';
import { BaseNotificationService } from '../base-notification.service';
import type { INotificationTransporter } from '../notification.interface';
import { NOTIFICATION_PROVIDERS, SMS_CONFIG } from '../notification.config';
import type { SmsConfig, SmsPayloadDto } from './sms-notification.dto';

@Injectable()
export class SmsService extends BaseNotificationService<SmsPayloadDto> {
  constructor(
    @Inject(NOTIFICATION_PROVIDERS.SMS)
    private readonly smsProviders: INotificationTransporter<SmsPayloadDto>[],
    @Inject(SMS_CONFIG)
    private readonly smsConfig: SmsConfig,
  ) {
    super();
  }

  // Send SMS using providers with fallback
  async send(payload: SmsPayloadDto): Promise<void> {
    const fromNumber = this.smsConfig.fromNumber;

    await this.sendWithProviderFallback(
      this.smsProviders,
      (provider) => provider.send({ ...payload, body: payload.body }),
      {
        recipient: payload.recipient,
        fromNumber,
        notificationType: 'SMS',
      },
    );
  }
}
