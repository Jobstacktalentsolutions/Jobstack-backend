import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Notification } from '@app/common/database/entities/Notification.entity';

// Core Services
import { NotificationService } from './notification.service';

// Email Services
import { EmailService } from './email/email.service';
import { EmailNotificationProcessor } from './email/email.processor';
import { SmsService } from './sms/sms.service';
import { SmsNotificationProcessor } from './sms/sms.processor';

// Provider Configuration
import { ALL_NOTIFICATION_PROVIDERS } from './notification.config';
import { NotificationType } from './notification.enum';

/**
 * Notification module - handles email notifications with queue processing
 * - EMAIL notifications are processed via queues with database persistence
 * - APP notifications are persisted to database for in-app display
 * - Uses unified transporter service with provider fallback for email delivery
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    // Register Bull queues for email and sms notifications
    BullModule.registerQueue({
      name: NotificationType.EMAIL,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),
    BullModule.registerQueue({
      name: NotificationType.SMS,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),
    ConfigModule,
  ],
  providers: [
    // Core Services
    NotificationService,

    // Email Services
    EmailService,
    // SMS Services
    SmsService,

    // Queue Processors (Bull consumers)
    EmailNotificationProcessor,
    SmsNotificationProcessor,

    // Provider implementations and configurations
    ...ALL_NOTIFICATION_PROVIDERS,
  ],
  exports: [NotificationService, TypeOrmModule],
})
export class NotificationModule {}
