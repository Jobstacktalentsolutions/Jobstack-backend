import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobsService } from './services/jobs.service';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Public endpoint to get a job by ID (no authentication required)
  @Get(':jobId')
  @ApiOperation({ summary: 'Get a published job by ID (public)' })
  getJobById(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.getJobById(jobId);
  }
}
