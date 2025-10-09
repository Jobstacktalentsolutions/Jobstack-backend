import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { AdminAuthModule } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuth]), AdminAuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtGuard],
  exports: [AdminService],
})
export class AdminModule {}
