import {
  Body,
  Controller,
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
import { JobApplicationsService } from './job-applications.service';
import {
  ApplicationQueryDto,
  CreateJobApplicationDto,
  UpdateApplicationStatusDto,
} from './dto';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@Controller('job-applications')
export class JobApplicationsController {
  constructor(
    private readonly jobApplicationsService: JobApplicationsService,
  ) {}

  // Allows a jobseeker to apply to a job
  @Post(':jobId')
  @UseGuards(JobSeekerJwtGuard)
  applyToJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CreateJobApplicationDto,
  ) {
    return this.jobApplicationsService.applyToJob(jobId, user.id, dto);
  }

  // Lists applications for the current jobseeker
  @Get('me')
  @UseGuards(JobSeekerJwtGuard)
  getMyApplications(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ApplicationQueryDto,
  ) {
    return this.jobApplicationsService.getJobseekerApplications(user.id, query);
  }

  // Lists applications for a job owned by the employer
  @Get('job/:jobId')
  @UseGuards(EmployerJwtGuard)
  getApplicationsForJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: ApplicationQueryDto,
  ) {
    return this.jobApplicationsService.getEmployerJobApplications(
      user.id,
      jobId,
      query,
    );
  }

  // Updates application status as an employer
  @Patch(':applicationId/status')
  @UseGuards(EmployerJwtGuard)
  updateApplicationStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.jobApplicationsService.updateApplicationStatus(
      user.id,
      applicationId,
      dto,
    );
  }

  // Lists all applications for admin
  @Get('admin')
  @UseGuards(AdminJwtGuard)
  getAdminApplications(@Query() query: ApplicationQueryDto) {
    return this.jobApplicationsService.getAdminApplications(query);
  }

  // Retrieves an application for admin
  @Get('admin/:applicationId')
  @UseGuards(AdminJwtGuard)
  getAdminApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.jobApplicationsService.getApplicationById(applicationId);
  }
}
