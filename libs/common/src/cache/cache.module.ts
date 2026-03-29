import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { ENV } from 'apps/api/src/modules/config';
import type { RedisStore } from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisUrl = configService.get<string>(
          ENV.REDIS_URL,
          'redis://localhost:6379',
        );
        const redisKeyPrefix = configService.get<string>(
          ENV.REDIS_KEY_PREFIX,
          'jobstack:',
        );

        try {
          const store = await redisStore({
            url: redisUrl,
            keyPrefix: redisKeyPrefix + 'cache:',
            ttl: 86400, // Default TTL: 24 hours (1 day)
          });

          return {
            store: store as unknown as RedisStore,
            ttl: 86400, // Default TTL: 24 hours (1 day)
          };
        } catch (error) {
          logger.warn(
            'Redis cache unavailable. Falling back to in-memory cache for this process.',
          );

          return {
            ttl: 86400, // Default TTL: 24 hours (1 day)
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
