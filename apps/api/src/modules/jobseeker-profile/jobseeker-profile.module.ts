import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobseekerProfileController } from './jobseeker-profile.controller';
import { JobseekerProfileService } from './jobseeker-profile.service';
import { StorageService } from '@app/common/storage/storage.service';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';

@Module({
  imports: [TypeOrmModule.forFeature([JobSeekerProfile, JobseekerAuth])],
  controllers: [JobseekerProfileController],
  providers: [JobseekerProfileService, StorageService, JobSeekerJwtGuard],
})
export class JobseekerProfileModule {}
