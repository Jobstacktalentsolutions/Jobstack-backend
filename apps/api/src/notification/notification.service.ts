import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationPriority } from '@app/common/database/entities/Notification.entity';
import { NotificationType } from './notification.enum';
import { EmailPayloadDto } from './email/email-notification.dto';
import { NotificationResponse, AppNotificationQuery } from './notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NotificationType.EMAIL) private readonly emailQueue: Queue,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>
  ) {}

  async sendEmailNotification(
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin',
    data: EmailPayloadDto,
    priority = NotificationPriority.LOW
  ): Promise<NotificationResponse> {
    try {
      // Create notification record
      const notification = this.notificationRepository.create({
        title: data.subject || 'Email Notification',
        message: data.context?.message || 'You have received an email notification',
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

      const savedNotification = await this.notificationRepository.save(notification);

      // Add to email queue
      await this.emailQueue.add('send_email', {
        ...data,
        notificationId: savedNotification.id,
      }, { 
        priority,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

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

  async sendAppNotification(
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin',
    data: {
      title: string;
      message: string;
      metadata?: Record<string, any>;
    },
    priority = NotificationPriority.LOW
  ): Promise<NotificationResponse> {
    try {
      const notification = this.notificationRepository.create({
        title: data.title,
        message: data.message,
        type: NotificationType.APP as any,
        status: NotificationStatus.SENT, // App notifications are immediately "sent"
        priority,
        metadata: {
          ...data.metadata,
          userType,
          createdAt: new Date().toISOString(),
        },
        sentAt: new Date(),
        ...(userType === 'jobseeker' && { jobseekerId: userId }),
        ...(userType === 'recruiter' && { recruiterId: userId }),
        ...(userType === 'admin' && { adminId: userId }),
      });

      const savedNotification = await this.notificationRepository.save(notification);

      // TODO: Implement real-time notification via WebSocket
      this.logger.log(`App notification created for ${userType} ${userId}`, {
        notificationId: savedNotification.id,
        title: data.title,
      });

      return {
        success: true,
        message: 'App notification created successfully',
        notificationId: savedNotification.id,
      };
    } catch (error) {
      this.logger.error('App notification failed', error.stack, {
        userId,
        userType,
        priority,
      });
      return {
        success: false,
        message: 'Failed to create app notification',
        skippedReason: 'Processing error',
      };
    }
  }

  async getUserNotifications(
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin',
    query: AppNotificationQuery = {}
  ) {
    const { page = 1, limit = 20, isRead, search } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where(`notification.${userType}Id = :userId`, { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (isRead !== undefined) {
      queryBuilder.andWhere(
        isRead 
          ? 'notification.status = :readStatus' 
          : 'notification.status != :readStatus',
        { readStatus: NotificationStatus.READ }
      );
    }

    if (search) {
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.message ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotificationById(
    notificationId: string,
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin'
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

  async markNotificationAsRead(
    notificationId: string,
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin'
  ): Promise<boolean> {
    try {
      const result = await this.notificationRepository.update(
        {
          id: notificationId,
          ...(userType === 'jobseeker' && { jobseekerId: userId }),
          ...(userType === 'recruiter' && { recruiterId: userId }),
          ...(userType === 'admin' && { adminId: userId }),
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        }
      );

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error('Failed to mark notification as read', error.stack, {
        notificationId,
        userId,
        userType,
      });
      return false;
    }
  }

  async markAllNotificationsAsRead(
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin'
  ): Promise<number> {
    try {
      const result = await this.notificationRepository.update(
        {
          ...(userType === 'jobseeker' && { jobseekerId: userId }),
          ...(userType === 'recruiter' && { recruiterId: userId }),
          ...(userType === 'admin' && { adminId: userId }),
          status: NotificationStatus.SENT, // Only mark unread notifications
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        }
      );

      return result.affected || 0;
    } catch (error) {
      this.logger.error('Failed to mark all notifications as read', error.stack, {
        userId,
        userType,
      });
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async getUnreadCount(
    userId: string,
    userType: 'jobseeker' | 'recruiter' | 'admin'
  ): Promise<number> {
    try {
      const count = await this.notificationRepository.count({
        where: {
          ...(userType === 'jobseeker' && { jobseekerId: userId }),
          ...(userType === 'recruiter' && { recruiterId: userId }),
          ...(userType === 'admin' && { adminId: userId }),
          status: NotificationStatus.SENT, // Unread notifications
        },
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to get unread count', error.stack, { userId, userType });
      throw new Error('Failed to get unread notification count');
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: Partial<Notification> = { status };
    
    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NotificationStatus.FAILED) {
      updateData.errorMessage = errorMessage;
    }

    await this.notificationRepository.update(notificationId, updateData);
  }
}
