import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
  Employee,
  EmployerProfile,
  Job,
  JobApplication,
  JobSeekerProfile,
  JobseekerSkill,
  Skill,
} from '@app/common/database/entities';
import { QUEUE_NAMES } from '@app/common/queue';
import { JobsController } from './jobs.controller';
import { JobsEmployerController } from './controllers/jobs-employer.controller';
import { JobsJobseekerController } from './controllers/jobs-jobseeker.controller';
import { JobsAdminController } from './controllers/jobs-admin.controller';
import { JobApplicationsController } from './submodules/application/job-applications.controller';
import { EmployeesController } from './submodules/employees/employees.controller';
import { JobsService } from './services/jobs.service';
import { JobRecommendationsService } from './services/job-recommendations.service';
import { JobRecommendationsProcessor } from './services/job-recommendations.processor';
import { JobVettingService } from './services/job-vetting.service';
import { JobApplicationsService } from './submodules/application/job-applications.service';
import { EmployeesService } from './submodules/employees/employees.service';
import {
  JobRecommendationsConsumer,
  JobRecommendationsProducer,
} from './queue';
import { JobVettingProducer } from './queue/job-vetting.producer';
import { JobVettingConsumer } from './queue/job-vetting.consumer';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  JobSeekerJwtGuard,
} from 'apps/api/src/guards';
import { AdminAuthModule } from '../auth/submodules/admin/admin-auth.module';
import { EmployerAuthModule } from '../auth/submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from '../auth/submodules/jobseeker/jobseeker-auth.module';
import { NotificationModule } from '../notification/notification.module';

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
    // Register the job recommendations queue
    BullModule.registerQueue({
      name: QUEUE_NAMES.JOB_RECOMMENDATIONS,
    }),
    // Register the job vetting queue
    BullModule.registerQueue({
      name: QUEUE_NAMES.JOB_VETTING,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 10,
        removeOnFail: 5,
      },
    }),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => EmployerAuthModule),
    forwardRef(() => JobSeekerAuthModule),
    NotificationModule,
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
    JobVettingService,
    // Bull queue consumer and producer
    JobRecommendationsConsumer,
    JobRecommendationsProducer,
    JobVettingConsumer,
    JobVettingProducer,
    JobApplicationsService,
    EmployeesService,
    AdminJwtGuard,
    EmployerJwtGuard,
    JobSeekerJwtGuard,
  ],
  exports: [JobsService, JobRecommendationsProducer, JobVettingProducer, JobVettingService],
})
export class JobsModule {}
