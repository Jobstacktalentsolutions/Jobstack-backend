import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { Document } from '@app/common/database/entities/Document.entity';
import { JobApplication } from '@app/common/database/entities/JobApplication.entity';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';
import { EmployerVerificationDocument } from '@app/common/database/entities/EmployerVerificationDocument.entity';
import { Job } from '@app/common/database/entities/Job.entity';
import { EmployerVerificationService } from './employer-verification.service';
import {
  EmployerVerificationController,
  AdminEmployerVerificationController,
} from './employer-verification.controller';
import { StorageService } from '@app/common/storage/storage.service';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { EmployerAuthModule } from 'apps/api/src/modules/auth/submodules/employer/employer-auth.module';
import { AuthModule } from 'apps/api/src/modules/auth/auth.module';
import { PublicEmployerController } from './public-employer.controller';
import { NotificationModule } from 'apps/api/src/modules/notification/notification.module';
import { ApprovalDecisionEmailService } from '../../approval-decision-email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployerProfile,
      EmployerAuth,
      EmployerVerificationDocument,
      Document,
      JobApplication,
      Job,
    ]),
    EmployerAuthModule,
    AuthModule,
    NotificationModule,
  ],
  controllers: [
    EmployerController,
    EmployerVerificationController,
    AdminEmployerVerificationController,
    PublicEmployerController,
  ],
  providers: [
    EmployerService,
    EmployerVerificationService,
    ApprovalDecisionEmailService,
    StorageService,
    EmployerJwtGuard,
  ],
  exports: [EmployerService, EmployerVerificationService],
})
export class EmployerModule {}
