import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AdminJwtGuard, RequireAdminRole } from 'apps/api/src/guards';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { JobsService } from '../services/jobs.service';
import { JobQueryDto, UpdateJobDto, UpdateJobStatusDto } from '../dto';

@Controller('jobs/admin')
export class JobsAdminController {
  constructor(private readonly jobsService: JobsService) {}

  // Lists all jobs for admins (no filters, can see everything)
  @Get()
  @UseGuards(AdminJwtGuard)
  getJobs(@Query() query: JobQueryDto) {
    return this.jobsService.getJobs(query);
  }

  // Retrieves a specific job for admins
  @Get(':jobId')
  @UseGuards(AdminJwtGuard)
  getJobById(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.getJobById(jobId);
  }

  // Allows admins to update job
  @Patch(':jobId')
  @UseGuards(AdminJwtGuard)
  updateJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.updateJob(jobId, dto);
  }

  // Allows admins to update job status (Operations & Support approves new job posts)
  @Patch(':jobId/status')
  @UseGuards(AdminJwtGuard)
  @RequireAdminRole(AdminRole.OPERATIONS_SUPPORT.role)
  updateJobStatus(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateJobStatus(jobId, dto);
  }

  // Allows admins to delete jobs
  @Delete(':jobId')
  @UseGuards(AdminJwtGuard)
  deleteJob(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.deleteJob(jobId);
  }
}
