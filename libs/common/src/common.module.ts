import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createJwtConfig } from '../../../apps/api/src/modules/config/jwt.config';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonService } from './common.service';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './cache/cache.module';
import { RedisModule } from './redis/redis.module';
import { ENV } from '../../../apps/api/src/modules/config/env.config';

@Global()
@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    CacheModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: createJwtConfig,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: configService.get<string>(ENV.REDIS_URL),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CommonService],
  exports: [CommonService, DatabaseModule, BullModule, JwtModule, CacheModule],
})
export class CommonModule {}
