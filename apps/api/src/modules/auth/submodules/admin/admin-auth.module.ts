import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminSession } from '@app/common/database/entities/AdminSession.entity';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from 'apps/api/src/modules/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuth, AdminSession]),
    NotificationModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtGuard],
  exports: [AdminAuthService, AdminJwtGuard],
})
export class AdminAuthModule {}
