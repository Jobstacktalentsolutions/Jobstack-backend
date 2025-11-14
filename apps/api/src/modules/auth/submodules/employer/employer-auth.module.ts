import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { EmployerSession } from '@app/common/database/entities/EmployerSession.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { createJwtConfig } from 'apps/api/src/modules/config/jwt.config';
import { EmployerAuthService } from './employer-auth.service';
import { EmployerAuthController } from './employer-auth.controller';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../../../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployerAuth, EmployerProfile, EmployerSession]),
    RedisModule,
    NotificationModule,
  ],
  controllers: [EmployerAuthController],
  providers: [EmployerAuthService, EmployerJwtGuard],
  exports: [EmployerAuthService, EmployerJwtGuard],
})
export class EmployerAuthModule {}
