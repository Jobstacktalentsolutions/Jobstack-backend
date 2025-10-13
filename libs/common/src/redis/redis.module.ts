import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { ENV } from 'apps/api/src/modules/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';
@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: async (configService: ConfigService): Promise<Redis> => {
        const REDIS_URL = configService.get<string>(
          ENV.REDIS_URL,
          'redis://localhost:6379',
        );
        const REDIS_KEY_PREFIX = configService.get<string>(
          ENV.REDIS_KEY_PREFIX,
          'jobstack:',
        );
        const client = new Redis(REDIS_URL, {
          keyPrefix: REDIS_KEY_PREFIX,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        client.on('connect', () => {
          console.log('✅ Redis connected for JobStack API');
        });

        client.on('ready', () => {
          console.log('🚀 Redis ready for JobStack API');
        });

        client.on('error', (error) => {
          console.error('❌ Redis error for JobStack API:', error.message);
        });

        client.on('close', () => {
          console.log('🔌 Redis connection closed for JobStack API');
        });

        // Connect asynchronously
        try {
          await client.connect();
        } catch (error) {
          console.error('Failed to connect to Redis:', error);
        }

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
