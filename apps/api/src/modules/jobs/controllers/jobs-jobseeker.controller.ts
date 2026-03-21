import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { JobsService } from '../services/jobs.service';
import { JobRecommendationsService } from '../services/job-recommendations.service';
import { JobQueryDto, JobRecommendationQueryDto } from '../dto';
import { JobStatus } from '@app/common/database/entities/schema.enum';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@ApiTags('Jobs (jobseeker)')
@ApiBearerAuth()
@Controller('jobs/jobseekers')
export class JobsJobseekerController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobRecommendationsService: JobRecommendationsService,
  ) {}

  // Gets all published and public jobs for jobseekers
  @Get()
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'List published jobs for jobseekers' })
  async getJobs(@Query() query: JobQueryDto) {
    const result = await this.jobsService.getJobs(query, {
      status: JobStatus.PUBLISHED,
      includeExpired: false,
    });

    return result;
  }

  // Gets job recommendations for authenticated job seeker
  @Get('recommendations')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'Personalized job recommendations' })
  getJobRecommendations(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: JobRecommendationQueryDto,
  ) {
    return this.jobRecommendationsService.getJobRecommendations(user.id, query);
  }
}
