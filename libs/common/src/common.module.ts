import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createJwtConfig } from '../../../apps/api/src/modules/config/jwt.config';
import { BullModule } from '@nestjs/bull';
import { CommonService } from './common.service';
import { DatabaseModule } from './database/database.module';
import { ENV } from '../../../apps/api/src/modules/config/env.config';

@Global()
@Module({
  imports: [
    DatabaseModule,
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
  exports: [CommonService, DatabaseModule, BullModule, JwtModule],
})
export class CommonModule {}
