import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Employee,
  EmployerProfile,
  Job,
  JobApplication,
  JobSeekerProfile,
  JobseekerSkill,
  Skill,
} from '@app/common/database/entities';
import { JobsController } from './jobs.controller';
import { JobsEmployerController } from './controllers/jobs-employer.controller';
import { JobsJobseekerController } from './controllers/jobs-jobseeker.controller';
import { JobsAdminController } from './controllers/jobs-admin.controller';
import { JobApplicationsController } from './submodules/application/job-applications.controller';
import { EmployeesController } from './submodules/employees/employees.controller';
import { JobsService } from './services/jobs.service';
import { JobRecommendationsService } from './services/job-recommendations.service';
import { JobRecommendationsProcessor } from './services/job-recommendations.processor';
import { JobRecommendationsScheduler } from './services/job-recommendations.scheduler';
import { JobApplicationsService } from './submodules/application/job-applications.service';
import { EmployeesService } from './submodules/employees/employees.service';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  JobSeekerJwtGuard,
} from 'apps/api/src/guards';
import { AdminAuthModule } from '../auth/submodules/admin/admin-auth.module';
import { EmployerAuthModule } from '../auth/submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from '../auth/submodules/jobseeker/jobseeker-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      Skill,
      EmployerProfile,
      JobApplication,
      JobSeekerProfile,
      JobseekerSkill,
      Employee,
    ]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => EmployerAuthModule),
    forwardRef(() => JobSeekerAuthModule),
  ],
  controllers: [
    JobsEmployerController,
    JobsJobseekerController,
    JobsAdminController,
    JobsController, // Public routes registered last to avoid conflicts
    JobApplicationsController,
    EmployeesController,
  ],
  providers: [
    JobsService,
    JobRecommendationsProcessor,
    JobRecommendationsService,
    JobRecommendationsScheduler,
    JobApplicationsService,
    EmployeesService,
    AdminJwtGuard,
    EmployerJwtGuard,
    JobSeekerJwtGuard,
  ],
  exports: [JobsService],
})
export class JobsModule {}
