import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Employee,
  EmployerProfile,
  Job,
  JobApplication,
  JobSeekerProfile,
  Skill,
} from '@app/common/database/entities';
import { JobsController } from './jobs.controller';
import { JobApplicationsController } from './submodules/application/job-applications.controller';
import { EmployeesController } from './submodules/employees/employees.controller';
import { JobsService } from './jobs.service';
import { JobApplicationsService } from './job-applications.service';
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
      Employee,
    ]),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => EmployerAuthModule),
    forwardRef(() => JobSeekerAuthModule),
  ],
  controllers: [JobsController, JobApplicationsController, EmployeesController],
  providers: [
    JobsService,
    JobApplicationsService,
    EmployeesService,
    AdminJwtGuard,
    EmployerJwtGuard,
    JobSeekerJwtGuard,
  ],
  exports: [JobsService],
})
export class JobsModule {}
