import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificationType } from '@app/common/database/entities/Notification.entity';
import { EmailPayloadDto } from './email-notification.dto';
import { EmailService } from './email.service';

@Processor(NotificationType.EMAIL)
@Injectable()
export class EmailNotificationProcessor {
  private readonly logger = new Logger(EmailNotificationProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send_email')
  async processEmail(job: Job<EmailPayloadDto>) {
    const jobId = job.id;

    try {
      await this.emailService.send(job.data);
      return {
        success: true,
        jobId,
        recipient: job.data.recipient,
        templateType: job.data.templateType,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Email job #${jobId} failed`, error.stack, {
        jobId,
        ...job.data,
      });
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  @Process('completed')
  async onCompleted(job: Job<EmailPayloadDto>, result: any) {
    this.logger.debug(`Email job #${job.id} completed`, {
      jobId: job.id,
      result,
    });
  }

  @Process('failed')
  async onFailed(job: Job<EmailPayloadDto>, error: Error) {
    this.logger.error(`Email job #${job.id} failed permanently`, error.stack, {
      jobId: job.id,
      attempts: job.attemptsMade,
      data: job.data,
    });
  }
}
