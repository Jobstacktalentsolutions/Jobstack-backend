import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from 'apps/api/src/guards';

@Module({
  imports: [TypeOrmModule.forFeature([AdminAuth])],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtGuard],
  exports: [AdminService],
})
export class AdminModule {}
