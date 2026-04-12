import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JobSeekerJwtGuard } from 'apps/api/src/guards';
import { JobsService } from '../services/jobs.service';
import { JobRecommendationsService } from '../services/job-recommendations.service';
import { JobBookmarksService } from '../services/job-bookmarks.service';
import { EmploymentFeedbackService } from '../services/employment-feedback.service';
import {
  DeclareEmploymentCompletionDto,
  JobQueryDto,
  JobRecommendationQueryDto,
  SubmitEmploymentFeedbackDto,
} from '../dto';
import { EmploymentCompletionService } from '../services/employment-completion.service';
import { JobStatus } from '@app/common/database/entities/schema.enum';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';

@ApiTags('Jobs (jobseeker)')
@ApiBearerAuth()
@Controller('jobs/jobseekers')
export class JobsJobseekerController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobRecommendationsService: JobRecommendationsService,
    private readonly jobBookmarksService: JobBookmarksService,
    private readonly employmentFeedbackService: EmploymentFeedbackService,
    private readonly employmentCompletionService: EmploymentCompletionService,
  ) {}

  // Resolves jobseeker profile id from JWT (required for bookmark and feedback routes).
  private jobseekerProfileId(user: CurrentUserPayload): string {
    if (!user.profileId) {
      throw new UnauthorizedException('Job seeker profile not found');
    }
    return user.profileId;
  }

  // Gets all published and public jobs for jobseekers
  @Get()
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'List published jobs for jobseekers' })
  async getJobs(@Query() query: JobQueryDto) {
    const result = await this.jobsService.getJobs(query, {
      statuses: [JobStatus.PUBLISHED, JobStatus.ACTIVE],
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

  @Get('bookmarks/ids')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({
    summary: 'List bookmarked job IDs for the current jobseeker',
  })
  async listBookmarkJobIds(@CurrentUser() user: CurrentUserPayload) {
    const jobIds = await this.jobBookmarksService.listJobIds(
      this.jobseekerProfileId(user),
    );
    return { jobIds };
  }

  @Get('bookmarks')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'List bookmarked jobs (paginated)' })
  async listBookmarks(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: JobQueryDto,
  ) {
    return this.jobBookmarksService.listBookmarks(
      this.jobseekerProfileId(user),
      query,
    );
  }

  @Post('bookmarks/:jobId')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'Save (bookmark) a job' })
  async addBookmark(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    await this.jobBookmarksService.add(this.jobseekerProfileId(user), jobId);
    return { success: true };
  }

  @Delete('bookmarks/:jobId')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'Remove a job bookmark' })
  async removeBookmark(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    await this.jobBookmarksService.remove(this.jobseekerProfileId(user), jobId);
    return { success: true };
  }

  @Post('employments/:employeeId/completion/declare')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({ summary: 'Declare mutual employment completion (jobseeker)' })
  async declareEmploymentCompletionJobseeker(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() body: DeclareEmploymentCompletionDto,
  ) {
    return this.employmentCompletionService.declareCompleteAsJobseeker(
      this.jobseekerProfileId(user),
      employeeId,
      body.note,
    );
  }

  @Get('employments/:employeeId/feedback/me')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({
    summary: 'Get current jobseeker feedback for an employment (if submitted)',
  })
  async getMyEmploymentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
  ) {
    const feedback =
      await this.employmentFeedbackService.getJobseekerFeedbackForEmployee(
        this.jobseekerProfileId(user),
        employeeId,
      );
    return { feedback };
  }

  @Post('employments/:employeeId/feedback')
  @UseGuards(JobSeekerJwtGuard)
  @ApiOperation({
    summary: 'Submit post-engagement feedback (jobseeker → employer)',
  })
  async submitEmploymentFeedback(
    @CurrentUser() user: CurrentUserPayload,
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() body: SubmitEmploymentFeedbackDto,
  ) {
    const feedback =
      await this.employmentFeedbackService.submitJobseekerFeedback(
        this.jobseekerProfileId(user),
        employeeId,
        body,
      );
    return { feedback };
  }
}
