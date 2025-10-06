import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminSession } from '@app/common/database/entities/AdminSession.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { createJwtConfig } from '@app/common/config/jwt.config';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuth, AdminSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: createJwtConfig,
      inject: [ConfigService],
    }),
    RedisModule,
    NotificationModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtGuard],
  exports: [AdminAuthService, AdminJwtGuard],
})
export class AdminAuthModule {}
