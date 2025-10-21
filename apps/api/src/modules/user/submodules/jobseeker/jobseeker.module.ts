import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobseekerSkill } from '@app/common/database/entities/JobseekerSkill.entity';
import { Document } from '@app/common/database/entities';
import { JobseekerController } from './jobseeker.controller';
import { JobseekerService } from './jobseeker.service';
import { StorageService } from '@app/common/storage/storage.service';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { JobSeekerAuthModule } from 'apps/api/src/modules/auth/submodules/jobseeker/jobseeker-auth.module';
import { SkillsModule } from 'apps/api/src/modules/skills/skills.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobSeekerProfile,
      JobseekerAuth,
      JobseekerSkill,
      Document,
    ]),
    JobSeekerAuthModule,
    SkillsModule,
  ],
  controllers: [JobseekerController],
  providers: [JobseekerService, StorageService, JobSeekerJwtGuard],
})
export class JobseekerModule {}
