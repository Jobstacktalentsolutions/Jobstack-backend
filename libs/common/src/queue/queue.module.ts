import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'apps/api/src/modules/config';

/**
 * Queue names as constants for type safety
 * Add new queue names here as needed
 */
export const QUEUE_NAMES = {
  JOB_RECOMMENDATIONS: 'job-recommendations',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Global Queue Module using BullMQ
 * Provides resilient job processing with Redis as the backing store
 * 
 * Features:
 * - Automatic retries with exponential backoff
 * - Job progress tracking
 * - Repeatable jobs (cron-like scheduling)
 * - Job prioritization
 * - Rate limiting
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>(
          ENV.REDIS_URL,
          'redis://localhost:6379',
        );
        const redisKeyPrefix = configService.get<string>(
          ENV.REDIS_KEY_PREFIX,
          'jobstack:',
        );

        // Parse Redis URL for Bull configuration
        const url = new URL(redisUrl);

        return {
          redis: {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
            username: url.username || undefined,
            tls: url.protocol === 'rediss:' ? {} : undefined,
          },
          prefix: `${redisKeyPrefix}bull`,
          defaultJobOptions: {
            removeOnComplete: 20, // Keep last 20 completed jobs
            removeOnFail: 20, // Keep last 20 failed jobs
            attempts: 2,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
