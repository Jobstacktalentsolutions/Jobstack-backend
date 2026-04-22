import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { EmployerSession } from '@app/common/database/entities/EmployerSession.entity';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { EmployerAuthService } from './employer-auth.service';
import { EmployerAuthController } from './employer-auth.controller';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../../../notification/notification.module';
import { GoogleIdentityModule } from '../../google/google-identity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployerAuth,
      JobseekerAuth,
      EmployerProfile,
      EmployerSession,
    ]),
    RedisModule,
    NotificationModule,
    GoogleIdentityModule,
  ],
  controllers: [EmployerAuthController],
  providers: [EmployerAuthService, EmployerJwtGuard],
  exports: [EmployerAuthService, EmployerJwtGuard],
})
export class EmployerAuthModule {}
