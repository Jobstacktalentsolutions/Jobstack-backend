import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  JobSeekerJwtGuard,
} from 'apps/api/src/guards';
import { JobsService } from './jobs.service';
import { JobRecommendationsService } from './job-recommendations.service';
import {
  CreateJobDto,
  JobQueryDto,
  JobRecommendationQueryDto,
  UpdateJobDto,
  UpdateJobStatusDto,
} from './dto';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobRecommendationsService: JobRecommendationsService,
  ) {}

  // Creates a job for the authenticated employer
  @Post()
  @UseGuards(EmployerJwtGuard)
  createJob(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.createJob(user.id, dto);
  }

  // Lists jobs that belong to the employer
  @Get()
  @UseGuards(EmployerJwtGuard)
  getEmployerJobs(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: JobQueryDto,
  ) {
    return this.jobsService.getEmployerJobs(user.id, query);
  }

  // Gets job recommendations for authenticated job seeker
  // IMPORTANT: This route must come before @Get(':jobId') to avoid route conflicts
  @Get('recommendations')
  @UseGuards(JobSeekerJwtGuard)
  getJobRecommendations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: JobRecommendationQueryDto,
  ) {
    return this.jobRecommendationsService.getJobRecommendations(user.id, query);
  }

  // Gets all published jobs for jobseekers (for explore/browse)
  // IMPORTANT: This route must come before @Get(':jobId') to avoid route conflicts
  @Get('published')
  @UseGuards(JobSeekerJwtGuard)
  getPublishedJobs(@Query() query: JobQueryDto) {
    return this.jobsService.getPublishedJobs(query);
  }

  // Retrieves a single employer job
  @Get(':jobId')
  @UseGuards(EmployerJwtGuard)
  getEmployerJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.getEmployerJobById(user.id, jobId);
  }

  // Updates employer job data
  @Patch(':jobId')
  @UseGuards(EmployerJwtGuard)
  updateJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.updateJob(user.id, jobId, dto);
  }

  // Updates only the job status
  @Patch(':jobId/status')
  @UseGuards(EmployerJwtGuard)
  updateJobStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateJobStatus(user.id, jobId, dto);
  }

  // Deletes a job and cascading relations
  @Delete(':jobId')
  @UseGuards(EmployerJwtGuard)
  deleteJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.deleteJob(user.id, jobId);
  }

  // Lists all jobs for admins
  @Get('admin')
  @UseGuards(AdminJwtGuard)
  getAdminJobs(@Query() query: JobQueryDto) {
    return this.jobsService.getAdminJobs(query);
  }

  // Retrieves a specific job for admins
  @Get('admin/:jobId')
  @UseGuards(AdminJwtGuard)
  getAdminJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.getAdminJob(jobId);
  }

  // Allows admins to update job status
  @Patch('admin/:jobId/status')
  @UseGuards(AdminJwtGuard)
  adminUpdateJobStatus(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.adminUpdateJobStatus(jobId, dto);
  }

  // Allows admins to delete jobs
  @Delete('admin/:jobId')
  @UseGuards(AdminJwtGuard)
  adminDeleteJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.adminDeleteJob(jobId);
  }
}
