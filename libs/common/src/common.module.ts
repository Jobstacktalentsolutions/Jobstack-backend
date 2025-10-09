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
        redis: configService.get<string>(ENV.REDIS_URL),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CommonService],
  exports: [CommonService, DatabaseModule, BullModule],
})
export class CommonModule {}
