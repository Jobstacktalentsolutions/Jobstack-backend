import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobseekerController } from './jobseeker.controller';
import { JobseekerService } from './jobseeker.service';
import { StorageService } from '@app/common/storage/storage.service';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { JobSeekerAuthModule } from 'apps/api/src/modules/auth/submodules/jobseeker/jobseeker-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobSeekerProfile, JobseekerAuth]),
    JobSeekerAuthModule,
  ],
  controllers: [JobseekerController],
  providers: [JobseekerService, StorageService, JobSeekerJwtGuard],
})
export class JobseekerModule {}
