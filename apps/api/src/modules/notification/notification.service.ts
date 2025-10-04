import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
  NotificationPriority,
} from '@app/common/database/entities/Notification.entity';
import { NotificationType } from './notification.enum';
import { EmailPayloadDto } from './email/email-notification.dto';
import { NotificationResponse } from './notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NotificationType.EMAIL) private readonly emailQueue: Queue,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Send email notification to a user
   * This method is used internally by other modules
   */
  async sendEmailNotification(
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin',
    data: EmailPayloadDto,
    priority = NotificationPriority.LOW,
  ): Promise<NotificationResponse> {
    try {
      // Create notification record
      const notification = this.notificationRepository.create({
        title: data.subject || 'Email Notification',
        message:
          data.context?.message || 'You have received an email notification',
        type: NotificationType.EMAIL as any,
        status: NotificationStatus.PENDING,
        priority,
        recipient: data.recipient,
        templateType: data.templateType,
        templateContext: data.context,
        metadata: {
          userType,
          queuedAt: new Date().toISOString(),
        },
        ...(userType === 'jobseeker' && { jobseekerId: userId }),
        ...(userType === 'recruiter' && { recruiterId: userId }),
        ...(userType === 'admin' && { adminId: userId }),
      });

      const savedNotification =
        await this.notificationRepository.save(notification);

      // Add to email queue
      await this.emailQueue.add(
        'send_email',
        {
          ...data,
          notificationId: savedNotification.id,
        },
        {
          priority,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      return {
        success: true,
        message: 'Email notification queued successfully',
        notificationId: savedNotification.id,
      };
    } catch (error) {
      this.logger.error('Email notification failed', error.stack, {
        userId,
        userType,
        priority,
      });
      return {
        success: false,
        message: 'Failed to queue email notification',
        skippedReason: 'Processing error',
      };
    }
  }

  /**
   * Get notification by ID for internal use
   */
  async getNotificationById(
    notificationId: string,
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin',
  ): Promise<Notification | null> {
    return this.notificationRepository.findOne({
      where: {
        id: notificationId,
        ...(userType === 'jobseeker' && { jobseekerId: userId }),
        ...(userType === 'recruiter' && { recruiterId: userId }),
        ...(userType === 'admin' && { adminId: userId }),
      },
    });
  }

  /**
   * Update notification status (for internal use by queue processors)
   */
  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: any = { status };
    if (errorMessage) {
      updateData.metadata = { errorMessage };
    }
    await this.notificationRepository.update(notificationId, updateData);
  }
}
