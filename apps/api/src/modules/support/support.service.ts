import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { NotificationService } from '../notification/notification.service';
import { ContactFormDto } from './dto/contact-form.dto';
import { EmailTemplateType } from '../notification/email/email-notification.enum';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(AdminAuth)
    private readonly adminAuthRepo: Repository<AdminAuth>,
    private readonly notificationService: NotificationService,
  ) {}

  async handleContactForm(data: ContactFormDto) {
    // 1. Find appropriate admin
    let recipientAdmin = await this.adminAuthRepo.findOne({
      where: {
        roleKey: AdminRole.OPERATIONS_SUPPORT.role,
        suspended: false,
      },
    });

    if (!recipientAdmin) {
      recipientAdmin = await this.adminAuthRepo.findOne({
        where: {
          roleKey: AdminRole.SUPER_ADMIN.role,
          suspended: false,
        },
      });
    }

    const recipientEmail = recipientAdmin?.email || 'support@jobstack.org'; // Fallback to a default support email if no admin found

    // 2. Send email
    try {
      await this.notificationService.sendEmail({
        to: recipientEmail,
        subject: `New Contact Form Submission from ${data.fullName}`,
        template: EmailTemplateType.CONTACT_FORM_SUBMISSION,
        context: {
          fullName: data.fullName,
          emailAddress: data.emailAddress,
          phoneNumber: data.phoneNumber,
          company: data.company,
          message: data.message,
        },
      });
      this.logger.log(`Contact form email sent to ${recipientEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send contact form email: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    return { success: true, message: 'Message sent successfully' };
  }
}
