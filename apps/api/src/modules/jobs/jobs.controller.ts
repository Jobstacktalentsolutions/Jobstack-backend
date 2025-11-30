import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { JobsService } from './services/jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Public endpoint to get a job by ID (no authentication required)
  @Get(':jobId')
  getJobById(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.getJobById(jobId);
  }
}
