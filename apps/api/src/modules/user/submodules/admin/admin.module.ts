import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from 'apps/api/src/guards';
import { AdminAuthModule } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.module';
import { NotificationModule } from 'apps/api/src/modules/notification/notification.module';
import { ApprovalDecisionEmailService } from '../../approval-decision-email.service';
import {
  AdminProfile,
  Employee,
  EmployerVerificationDocument,
  EmployerProfile,
  EmployerAuth,
  Job,
  JobseekerAuth,
  JobSeekerProfile,
  JobseekerVerificationDocument,
  Payment,
} from '@app/common/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminAuth,
      AdminProfile,
      EmployerVerificationDocument,
      EmployerProfile,
      EmployerAuth,
      JobseekerAuth,
      JobSeekerProfile,
      JobseekerVerificationDocument,
      Job,
      Employee,
      Payment,
    ]),
    AdminAuthModule,
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminJwtGuard, ApprovalDecisionEmailService],
  exports: [AdminService],
})
export class AdminModule {}
