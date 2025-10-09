import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { CommonService } from './common.service';
import { DatabaseModule } from './database/database.module';
import { ENV } from './config/env.config';

@Global()
@Module({
  imports: [
    DatabaseModule,
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        redis: {
          host:
            configService
              .get<string>(ENV.REDIS_URL)
              ?.split('://')[1]
              ?.split(':')[0] || 'localhost',
          port: parseInt(
            configService.get<string>(ENV.REDIS_URL)?.split(':')[2] || '6379',
          ),
          password: configService.get<string>(ENV.REDIS_URL)?.includes('@')
            ? configService
                .get<string>(ENV.REDIS_URL)
                ?.split('@')[0]
                ?.split('://')[1]
            : undefined,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CommonService],
  exports: [CommonService, DatabaseModule, BullModule],
})
export class CommonModule {}
