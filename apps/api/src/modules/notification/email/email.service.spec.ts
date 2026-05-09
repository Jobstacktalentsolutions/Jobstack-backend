import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { EmailTemplateType } from './email-notification.enum';
import { EMAIL_CONFIG, NOTIFICATION_PROVIDERS } from '../notification.config';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: NOTIFICATION_PROVIDERS.EMAIL,
          useValue: [],
        },
        {
          provide: EMAIL_CONFIG,
          useValue: {
            companyName: 'JobStack',
            supportEmail: 'support@jobstack.ng',
            websiteUrl: 'https://jobstack.ng',
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('renders the jobseeker welcome content for the explicit template', async () => {
    const html = await service.renderTemplate(
      EmailTemplateType.JOBSEEKER_WELCOME,
      {
        firstName: 'Ada',
      },
    );

    expect(html).toContain('Your first moves as a jobseeker');
    expect(html).toContain('Complete your profile so employers can find you');
    expect(html).not.toContain('Your first moves as an employer');
  });

  it('renders the employer welcome content for the explicit template', async () => {
    const html = await service.renderTemplate(
      EmailTemplateType.EMPLOYER_WELCOME,
      {
        firstName: 'Tunde',
      },
    );

    expect(html).toContain('Your first moves as an employer');
    expect(html).toContain('Post your first role with clear requirements');
    expect(html).not.toContain('Your first moves as a jobseeker');
  });
});
