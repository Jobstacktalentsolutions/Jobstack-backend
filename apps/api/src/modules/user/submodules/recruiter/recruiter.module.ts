import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { Document } from '@app/common/database/entities/Document.entity';
import { RecruiterController } from './recruiter.controller';
import { RecruiterService } from './recruiter.service';
import { RecruiterVerification } from '@app/common/database/entities/RecruiterVerification.entity';
import { RecruiterVerificationService } from './recruiter-verification.service';
import { RecruiterVerificationController } from './recruiter-verification.controller';
import { StorageService } from '@app/common/storage/storage.service';
import { RecruiterJwtGuard } from 'apps/api/src/guards';
import { RecruiterAuthModule } from 'apps/api/src/modules/auth/submodules/recruiter/recruiter-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecruiterProfile,
      RecruiterAuth,
      RecruiterVerification,
      Document,
    ]),
    RecruiterAuthModule,
  ],
  controllers: [RecruiterController, RecruiterVerificationController],
  providers: [
    RecruiterService,
    RecruiterVerificationService,
    StorageService,
    RecruiterJwtGuard,
  ],
  exports: [RecruiterService],
})
export class RecruiterModule {}
