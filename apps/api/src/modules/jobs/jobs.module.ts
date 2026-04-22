import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import {
  AdminAuth,
  Employee,
  EmployerProfile,
  EmploymentFeedback,
  Job,
  JobApplication,
  JobBookmark,
  JobSeekerProfile,
  JobseekerSkill,
  Skill,
} from '@app/common/database/entities';
import { QUEUE_NAMES } from '@app/common/queue';
import { JobsController } from './jobs.controller';
import { JobsEmployerController } from './controllers/jobs-employer.controller';
import { JobsJobseekerController } from './controllers/jobs-jobseeker.controller';
import { JobsAdminController } from './controllers/jobs-admin.controller';
import { ProbationAdminController } from './controllers/probation-admin.controller';
import { JobApplicationsController } from './submodules/application/job-applications.controller';
import { EmployeesController } from './submodules/employees/employees.controller';
import { JobsService } from './services/jobs.service';
import { JobBookmarksService } from './services/job-bookmarks.service';
import { EmploymentFeedbackService } from './services/employment-feedback.service';
import { EmploymentCompletionService } from './services/employment-completion.service';
import { JobRecommendationsService } from './services/job-recommendations.service';
import { JobRecommendationsProcessor } from './services/job-recommendations.processor';
import { JobVettingService } from './services/job-vetting.service';
import { JobPostMatchNotifyService } from './services/job-post-match-notify.service';
import { JobVettingMilestoneNotifyService } from './services/job-vetting-milestone-notify.service';
import { JobActivationService } from './services/job-activation.service';
import { JobApplicationsService } from './submodules/application/job-applications.service';
import { EmployeesService } from './submodules/employees/employees.service';
import {
  JobRecommendationsConsumer,
  JobRecommendationsProducer,
} from './queue';
import { JobVettingProducer } from './queue/job-vetting.producer';
import { JobVettingConsumer } from './queue/job-vetting.consumer';
import { JobPostMatchNotifyProducer } from './queue/job-post-match-notify.producer';
import { JobPostMatchNotifyConsumer } from './queue/job-post-match-notify.consumer';
import { ProbationTrackingConsumer, ProbationTrackingProducer } from './queue';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  JobSeekerJwtGuard,
  EmployeeProbationAccessGuard,
} from 'apps/api/src/guards';
import { AdminAuthModule } from '../auth/submodules/admin/admin-auth.module';
import { EmployerAuthModule } from '../auth/submodules/employer/employer-auth.module';
import { JobSeekerAuthModule } from '../auth/submodules/jobseeker/jobseeker-auth.module';
import { NotificationModule } from '../notification/notification.module';
import { ProbationTrackingService } from './services/probation-tracking.service';
import { AdminReplacementService } from './services/admin-replacement.service';
import { EmployerDashboardStatsService } from './services/employer-dashboard-stats.service';
import { StorageModule } from '@app/common/storage';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      AdminAuth,
      Job,
      Skill,
      EmployerProfile,
      JobApplication,
      JobBookmark,
      JobSeekerProfile,
      JobseekerSkill,
      Employee,
      EmploymentFeedback,
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
    // Register probation tracking queue (per-employee delayed jobs).
    BullModule.registerQueue({
      name: QUEUE_NAMES.JOB_PROBATION_TRACKING,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.JOB_POST_MATCH_NOTIFY,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 20,
        removeOnFail: 10,
      },
    }),
    forwardRef(() => AdminAuthModule),
    forwardRef(() => EmployerAuthModule),
    forwardRef(() => JobSeekerAuthModule),
    NotificationModule,
    StorageModule,
  ],
  controllers: [
    JobsEmployerController,
    JobsJobseekerController,
    JobsAdminController,
    JobsController, // Public routes registered last to avoid conflicts
    JobApplicationsController,
    EmployeesController,
    ProbationAdminController,
  ],
  providers: [
    JobsService,
    JobBookmarksService,
    EmploymentFeedbackService,
    EmploymentCompletionService,
    EmployerDashboardStatsService,
    JobRecommendationsProcessor,
    JobRecommendationsService,
    JobVettingService,
    JobPostMatchNotifyService,
    JobVettingMilestoneNotifyService,
    JobActivationService,
    // Bull queue consumer and producer
    JobRecommendationsConsumer,
    JobRecommendationsProducer,
    JobVettingConsumer,
    JobVettingProducer,
    JobPostMatchNotifyConsumer,
    JobPostMatchNotifyProducer,
    ProbationTrackingConsumer,
    ProbationTrackingProducer,
    ProbationTrackingService,
    AdminReplacementService,
    JobApplicationsService,
    EmployeesService,
    AdminJwtGuard,
    EmployerJwtGuard,
    JobSeekerJwtGuard,
    EmployeeProbationAccessGuard,
  ],
  exports: [
    JobsService,
    JobRecommendationsProducer,
    JobVettingProducer,
    JobPostMatchNotifyProducer,
    JobVettingService,
  ],
})
export class JobsModule {}
