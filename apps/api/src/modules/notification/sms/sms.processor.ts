import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificationType } from '../notification.enum';
import type { SmsPayloadDto } from './sms-notification.dto';
import { SmsService } from './sms.service';

@Processor(NotificationType.SMS)
@Injectable()
export class SmsNotificationProcessor {
  private readonly logger = new Logger(SmsNotificationProcessor.name);

  constructor(private readonly smsService: SmsService) {}

  @Process('send_sms')
  async processSms(job: Job<SmsPayloadDto>) {
    const jobId = job.id;
    try {
      await this.smsService.send(job.data);
      return {
        success: true,
        jobId,
        recipient: job.data.recipient,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`SMS job #${jobId} failed`, error.stack, {
        jobId,
        ...job.data,
      });
      throw new Error(`SMS delivery failed: ${error.message}`);
    }
  }
}
