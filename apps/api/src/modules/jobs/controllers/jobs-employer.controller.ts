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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { JobsService } from '../services/jobs.service';
import { EmployerDashboardStatsService } from '../services/employer-dashboard-stats.service';
import {
  CreateJobDto,
  JobQueryDto,
  UpdateJobDto,
  UpdateJobStatusDto,
} from '../dto';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@ApiTags('Jobs (employer)')
@ApiBearerAuth()
@Controller('jobs/employer')
export class JobsEmployerController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly employerDashboardStatsService: EmployerDashboardStatsService,
  ) {}

  // Creates a job for the authenticated employer
  @Post()
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Create a job' })
  @ApiBody({ type: CreateJobDto })
  createJob(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.createJob(user.id, dto);
  }

  // Lists all jobs for the authenticated employer
  @Get()
  @UseGuards(EmployerJwtGuard)
  getJobs(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: JobQueryDto,
  ) {
    return this.jobsService.getJobs(query, { employerId: user.id });
  }

  // Retrieves a single employer job ensuring ownership
  @Get(':jobId')
  @UseGuards(EmployerJwtGuard)
  getJobById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.getEmployerJobById(user.id, jobId);
  }

  // Updates employer job data
  @Patch(':jobId')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Update a job' })
  @ApiBody({ type: UpdateJobDto })
  updateJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.updateJob(jobId, dto, user.id);
  }

  // Updates only the job status
  @Patch(':jobId/status')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Update job status' })
  @ApiBody({ type: UpdateJobStatusDto })
  updateJobStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateJobStatus(jobId, dto, user.id);
  }

  // Deletes a job and cascading relations
  @Delete(':jobId')
  @UseGuards(EmployerJwtGuard)
  deleteJob(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.deleteJob(jobId, user.id);
  }

  // Returns dashboard KPIs for the authenticated employer (no pagination limits).
  @Get('stats/dashboard')
  @UseGuards(EmployerJwtGuard)
  getEmployerDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    return this.employerDashboardStatsService.getEmployerDashboardStats(
      user.id,
    );
  }
}
