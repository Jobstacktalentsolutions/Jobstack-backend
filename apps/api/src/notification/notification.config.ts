import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoEmailProvider } from './email/providers/brevo-email.provider';
import { EmailConfig } from './email/email-notification.dto';

export const NOTIFICATION_PROVIDERS = {
  EMAIL: 'EMAIL_PROVIDERS',
} as const;

export const EMAIL_CONFIG = 'EMAIL_CONFIG';

// Email providers configuration - Only Brevo for now
export const EMAIL_PROVIDERS_CONFIG: Provider[] = [
  {
    provide: NOTIFICATION_PROVIDERS.EMAIL,
    useFactory: (brevoEmail: BrevoEmailProvider) => [brevoEmail],
    inject: [BrevoEmailProvider],
  },
  {
    provide: EMAIL_CONFIG,
    useFactory: (configService: ConfigService): EmailConfig => ({
      companyName: configService.get('COMPANY_NAME') || 'JobStack',
      supportEmail: configService.get('SUPPORT_EMAIL') || 'support@jobstack.ng',
      websiteUrl: configService.get('WEBSITE_URL') || 'https://jobstack.ng',
    }),
    inject: [ConfigService],
  },
];

// All notification providers combined
export const ALL_NOTIFICATION_PROVIDERS: Provider[] = [
  BrevoEmailProvider,
  ...EMAIL_PROVIDERS_CONFIG,
];
