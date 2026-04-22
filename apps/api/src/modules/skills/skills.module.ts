import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from '@app/common/database/entities/Skill.entity';
import { JobseekerSkill } from '@app/common/database/entities/JobseekerSkill.entity';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  JobSeekerJwtGuard,
} from 'apps/api/src/guards';
import { AdminAuthModule } from '../auth/submodules/admin/admin-auth.module';
import { JobSeekerAuthModule } from '../auth/submodules/jobseeker/jobseeker-auth.module';
import { EmployerAuthModule } from '../auth/submodules/employer/employer-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill, JobseekerSkill]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => JobSeekerAuthModule),
    forwardRef(() => EmployerAuthModule),
  ],
  controllers: [SkillsController],
  providers: [
    SkillsService,
    AdminJwtGuard,
    JobSeekerJwtGuard,
    EmployerJwtGuard,
  ],
  exports: [SkillsService],
})
export class SkillsModule {}
