import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { RecruiterSession } from '@app/common/database/entities/RecruiterSession.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { createJwtConfig } from '@app/common/config/jwt.config';
import { RecruiterAuthService } from './recruiter-auth.service';
import { RecruiterAuthController } from './recruiter-auth.controller';
import { RecruiterJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../../../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruiterAuth,
      RecruiterProfile,
      RecruiterSession,
    ]),
    RedisModule,
    NotificationModule,
  ],
  controllers: [RecruiterAuthController],
  providers: [RecruiterAuthService, RecruiterJwtGuard],
  exports: [RecruiterAuthService, RecruiterJwtGuard],
})
export class RecruiterAuthModule {}
