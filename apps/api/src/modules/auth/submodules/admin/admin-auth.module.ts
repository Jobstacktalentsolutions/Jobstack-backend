import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminSession } from '@app/common/database/entities/AdminSession.entity';
import { RedisModule } from '@app/common/redis/redis.module';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from 'apps/api/src/modules/notification/notification.module';
import { SkillsModule } from 'apps/api/src/modules/skills/skills.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuth, AdminSession]),
    RedisModule,
    NotificationModule,
    // forwardRef(() => SkillsModule),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminJwtGuard],
  exports: [AdminAuthService, AdminJwtGuard],
})
export class AdminAuthModule {}
