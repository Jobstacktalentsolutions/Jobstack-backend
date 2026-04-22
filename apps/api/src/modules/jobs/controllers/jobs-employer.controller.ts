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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployerJwtGuard } from 'apps/api/src/guards';
import { JobsService } from '../services/jobs.service';
import { JobVettingService } from '../services/job-vetting.service';
import { EmployerDashboardStatsService } from '../services/employer-dashboard-stats.service';
import {
  AdjustHighlightedCountDto,
  CreateJobDto,
  EmployerCompleteScreeningDto,
  EmployerPickCandidateDto,
  EmployerSelectForScreeningDto,
  JobQueryDto,
  UpdateJobDto,
  UpdateJobStatusDto,
} from '../dto';
import { CurrentUser, type CurrentUserPayload } from '@app/common/shared';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobApplication } from '@app/common/database/entities';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';

@ApiTags('Jobs (employer)')
@ApiBearerAuth()
@Controller('jobs/employer')
export class JobsEmployerController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobVettingService: JobVettingService,
    private readonly employerDashboardStatsService: EmployerDashboardStatsService,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
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

  // Returns dashboard KPIs for the authenticated employer.
  // Defined before :jobId routes to avoid route conflicts.
  @Get('stats/dashboard')
  @UseGuards(EmployerJwtGuard)
  getEmployerDashboardStats(@CurrentUser() user: CurrentUserPayload) {
    return this.employerDashboardStatsService.getEmployerDashboardStats(
      user.id,
    );
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

  // ─── Vetting & Candidate Pipeline ────────────────────────────────────────────

  /**
   * Returns ranked applicants for a job owned by the employer.
   * PII fields (email, phone) are masked per-candidate until the employer pays
   * to unlock them (application.piiUnlocked = true).
   */
  @Get(':jobId/vetted-applicants')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Get ranked applicants (employer view, PII gated)' })
  getVettedApplicants(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobVettingService.getVettedApplicantsForEmployer(jobId, user.id);
  }

  /**
   * Employer adjusts how many top candidates are highlighted for a job.
   */
  @Patch(':jobId/highlighted-count')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Set highlighted candidate count' })
  @ApiBody({ type: AdjustHighlightedCountDto })
  async adjustHighlightedCount(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: AdjustHighlightedCountDto,
  ) {
    const { count } = dto;
    if (count < 1 || count > 10) {
      return { success: false, message: 'Highlighted count must be between 1 and 10' };
    }
    await this.jobsService.updateJob(
      jobId,
      { highlightedCandidateCount: count } as any,
      user.id,
    );
    return {
      success: true,
      message: `Highlighted candidate count updated to ${count}`,
      highlightedCount: count,
    };
  }

  /**
   * Employer schedules a single candidate for screening.
   * Validates: employer owns job, candidate piiUnlocked, candidate is VETTED.
   * Sets status → SELECTED_FOR_SCREENING and notifies the jobseeker.
   */
  @Post(':jobId/select-for-screening')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Schedule a candidate for screening' })
  @ApiBody({ type: EmployerSelectForScreeningDto })
  async selectForScreening(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: EmployerSelectForScreeningDto,
  ) {
    await this.jobsService.getEmployerJobById(user.id, jobId);

    const application = await this.applicationRepo.findOne({
      where: { id: dto.applicationId, jobId },
    });
    if (!application) {
      return { success: false, message: 'Application not found for this job' };
    }
    if (!application.piiUnlocked) {
      return {
        success: false,
        message:
          "You must unlock this candidate's contact info before scheduling them for screening.",
      };
    }
    if (application.status !== JobApplicationStatus.VETTED) {
      return {
        success: false,
        message: `Cannot schedule a candidate with status: ${application.status}`,
      };
    }

    await this.applicationRepo.update(
      { id: dto.applicationId },
      {
        status: JobApplicationStatus.SELECTED_FOR_SCREENING,
        screeningMeetingLink: dto.meetingLink,
        screeningScheduledAt: new Date(dto.scheduledAt),
        screeningPrepInfo: dto.prepInfo ?? undefined,
        screeningDurationMinutes: dto.durationMinutes,
        statusUpdatedAt: new Date(),
      },
    );

    await this.jobVettingService.notifyCandidatesForScreening([
      dto.applicationId,
    ]);

    return {
      success: true,
      message:
        'Candidate scheduled for screening. Jobseeker has been notified.',
      applicationId: dto.applicationId,
    };
  }

  /**
   * Employer marks screening as complete for one or more applications.
   * Sends post-screening notifications to jobseekers.
   * Optionally persists screening notes on all listed applications.
   */
  @Post(':jobId/complete-screening')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Mark screening as complete' })
  @ApiBody({ type: EmployerCompleteScreeningDto })
  async completeScreening(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: EmployerCompleteScreeningDto,
  ) {
    await this.jobsService.getEmployerJobById(user.id, jobId);

    if (!dto.applicationIds?.length) {
      return { success: false, message: 'No application IDs provided' };
    }

    await this.jobVettingService.notifyCandidatesAfterScreening(
      dto.applicationIds,
    );

    if (dto.strengths || dto.concerns || dto.interviewFeedback) {
      for (const id of dto.applicationIds) {
        await this.applicationRepo.update(
          { id, jobId },
          {
            screeningStrengths: dto.strengths ?? null,
            screeningConcerns: dto.concerns ?? null,
            screeningInterviewFeedback: dto.interviewFeedback ?? null,
          },
        );
      }
    }

    return {
      success: true,
      message: `Screening marked complete. ${dto.applicationIds.length} candidate(s) notified.`,
      notifiedCount: dto.applicationIds.length,
    };
  }

  /**
   * Employer selects the final candidate for hire.
   * Atomic: clears any previous pick, sets OFFER_SENT, creates Employee record,
   * and notifies the jobseeker — in one step. No separate employer-accept step.
   */
  @Post(':jobId/pick-candidate')
  @UseGuards(EmployerJwtGuard)
  @ApiOperation({ summary: 'Select candidate for hire (creates offer, no separate accept step)' })
  @ApiBody({ type: EmployerPickCandidateDto })
  pickCandidate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: EmployerPickCandidateDto,
  ) {
    return this.jobVettingService.employerPickCandidate(jobId, user.id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    });
  }
}
