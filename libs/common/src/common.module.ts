import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createJwtConfig } from '../../../apps/api/src/modules/config/jwt.config';
import { CommonService } from './common.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';

/**
 * Global Common Module
 * Provides shared services and modules across the application
 * 
 * Includes:
 * - DatabaseModule: TypeORM database connection
 * - RedisModule: Redis client for direct Redis operations
 * - CacheModule: Cache manager with Redis store
 * - QueueModule: BullMQ for job processing and scheduling
 * - JwtModule: JWT authentication
 */
@Global()
@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    CacheModule,
    QueueModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: createJwtConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [CommonService],
  exports: [
    CommonService,
    DatabaseModule,
    RedisModule,
    CacheModule,
    QueueModule,
    JwtModule,
  ],
})
export class CommonModule {}
