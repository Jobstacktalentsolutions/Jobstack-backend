import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Notification } from '@app/common/database/entities/Notification.entity';

// Core Services
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

// Email Services
import { EmailService } from './email/email.service';
import { EmailNotificationProcessor } from './email/email.processor';

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
    // Register Bull queue for email notifications
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
    ConfigModule,
  ],
  controllers: [NotificationController],
  providers: [
    // Core Services
    NotificationService,

    // Email Services
    EmailService,

    // Queue Processors (Bull consumers)
    EmailNotificationProcessor,

    // Provider implementations and configurations
    ...ALL_NOTIFICATION_PROVIDERS,
  ],
  exports: [
    NotificationService,
    TypeOrmModule,
  ],
})
export class NotificationModule {}
