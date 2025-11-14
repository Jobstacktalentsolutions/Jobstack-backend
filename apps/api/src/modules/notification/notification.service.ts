import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Notification } from '@app/common/database/entities/Notification.entity';
import {
  NotificationStatus,
  NotificationPriority,
  NotificationType,
} from '@app/common/database/entities/schema.enum';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import {
  NotificationResponse,
  AppNotificationQuery,
} from './notification.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectQueue(NotificationType.EMAIL) private readonly emailQueue: Queue,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // Helper to map UserRole enum to database field name
  private getUserRoleFieldName(
    role: UserRole,
  ): 'jobseekerId' | 'employerId' | 'adminId' {
    switch (role) {
      case UserRole.JOB_SEEKER:
        return 'jobseekerId';
      case UserRole.EMPLOYER:
        return 'employerId';
      case UserRole.ADMIN:
        return 'adminId';
      default:
        throw new Error(`Invalid user role: ${role}`);
    }
  }

  async getUserNotifications(
    userId: string,
    userType: UserRole,
    query: AppNotificationQuery = {},
  ) {
    const { page = 1, limit = 20, isRead, search } = query;
    const skip = (page - 1) * limit;
    const fieldName = this.getUserRoleFieldName(userType);

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where(`notification.${fieldName} = :userId`, { userId })
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (isRead !== undefined) {
      queryBuilder.andWhere(
        isRead
          ? 'notification.status = :readStatus'
          : 'notification.status != :readStatus',
        { readStatus: NotificationStatus.READ },
      );
    }

    if (search) {
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.message ILIKE :search)',
        { search: `%${search}%` },
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
    userType: UserRole,
  ): Promise<Notification | null> {
    const fieldName = this.getUserRoleFieldName(userType);
    return this.notificationRepository.findOne({
      where: {
        id: notificationId,
        [fieldName]: userId,
      },
    });
  }

  async markNotificationAsRead(
    notificationId: string,
    userId: string,
    userType: UserRole,
  ): Promise<boolean> {
    try {
      const fieldName = this.getUserRoleFieldName(userType);
      const result = await this.notificationRepository.update(
        {
          id: notificationId,
          [fieldName]: userId,
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
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
    userType: UserRole,
  ): Promise<number> {
    try {
      const fieldName = this.getUserRoleFieldName(userType);
      const result = await this.notificationRepository.update(
        {
          [fieldName]: userId,
          status: NotificationStatus.SENT, // Only mark unread notifications
        },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      );

      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        'Failed to mark all notifications as read',
        error.stack,
        {
          userId,
          userType,
        },
      );
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async getUnreadCount(userId: string, userType: UserRole): Promise<number> {
    try {
      const fieldName = this.getUserRoleFieldName(userType);
      const count = await this.notificationRepository.count({
        where: {
          [fieldName]: userId,
          status: NotificationStatus.SENT, // Unread notifications
        },
      });

      return count;
    } catch (error) {
      this.logger.error('Failed to get unread count', error.stack, {
        userId,
        userType,
      });
      throw new Error('Failed to get unread notification count');
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<Notification> = { status };

    if (status === NotificationStatus.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NotificationStatus.FAILED) {
      updateData.errorMessage = errorMessage;
    }

    await this.notificationRepository.update(notificationId, updateData);
  }

  /**
   * Create an app notification for a specific user
   */
  async createAppNotification(
    userId: string,
    userType: UserRole,
    data: {
      title: string;
      message: string;
      metadata?: Record<string, any>;
      priority?: NotificationPriority;
    },
  ): Promise<Notification> {
    const fieldName = this.getUserRoleFieldName(userType);
    const notification = this.notificationRepository.create({
      title: data.title,
      message: data.message,
      type: NotificationType.APP,
      status: NotificationStatus.PENDING,
      priority: data.priority ?? NotificationPriority.MEDIUM,
      metadata: data.metadata,
      [fieldName]: userId,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Simple email sending wrapper for authentication flows
   * This method doesn't require userId and creates a simplified notification
   */
  async sendEmail(data: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  }): Promise<void> {
    try {
      // Queue email directly without creating notification record
      await this.emailQueue.add(
        'send_email',
        {
          recipient: data.to,
          subject: data.subject,
          templateType: data.template,
          context: data.context,
        },
        {
          priority: NotificationPriority.HIGH,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      this.logger.log(`Email queued for ${data.to}: ${data.subject}`);
    } catch (error) {
      this.logger.error('Failed to queue email', error.stack, {
        recipient: data.to,
        subject: data.subject,
      });
      throw error;
    }
  }
}
