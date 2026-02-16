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
  Post,
} from '@nestjs/common';
import { AdminJwtGuard, RequireAdminRole } from 'apps/api/src/guards';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { JobsService } from '../services/jobs.service';
import { JobVettingService } from '../services/job-vetting.service';
import { JobVettingProducer } from '../queue/job-vetting.producer';
import {
  AdjustHighlightedCountDto,
  CompleteScreeningDto,
  JobQueryDto,
  SelectCandidatesForScreeningDto,
  UpdateJobDto,
  UpdateJobStatusDto,
} from '../dto';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Job, JobApplication } from '@app/common/database/entities';

@Controller('jobs/admin')
export class JobsAdminController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobVettingService: JobVettingService,
    private readonly jobVettingProducer: JobVettingProducer,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  // Get job statistics
  @Get('stats')
  @UseGuards(AdminJwtGuard)
  getStats() {
    return this.jobsService.getJobStats();
  }

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

  // Manually trigger vetting for a job
  @Post(':jobId/vet')
  @UseGuards(AdminJwtGuard)
  async triggerVetting(@Param('jobId', ParseUUIDPipe) jobId: string) {
    const result = await this.jobVettingProducer.queueJobVetting(
      jobId,
      'manual',
    );
    return {
      success: true,
      message: 'Vetting job queued successfully',
      queueJobId: result.jobId,
    };
  }

  // Get all applications for a job (admin view)
  @Get(':jobId/applications')
  @UseGuards(AdminJwtGuard)
  async getJobApplications(@Param('jobId', ParseUUIDPipe) jobId: string) {
    const applications = await this.applicationRepo.find({
      where: { jobId },
      relations: ['jobseekerProfile', 'jobseekerProfile.profilePicture'],
      order: { createdAt: 'DESC' },
    });

    return applications.map((app) => ({
      id: app.id,
      status: app.status,
      appliedAt: app.createdAt,
      screeningMeetingLink: app.screeningMeetingLink,
      screeningScheduledAt: app.screeningScheduledAt,
      screeningDurationMinutes: app.screeningDurationMinutes,
      employerWillJoinScreening: app.employerWillJoinScreening,
      adminProposedScreeningTime: app.adminProposedScreeningTime,
      employerProposedScreeningTime: app.employerProposedScreeningTime,
      employerAccepted: app.employerAccepted,
      adminAccepted: app.adminAccepted,
      jobseeker: {
        id: app.jobseekerProfile.id,
        firstName: app.jobseekerProfile.firstName,
        lastName: app.jobseekerProfile.lastName,
        email: app.jobseekerProfile.email,
        avatarUrl: app.jobseekerProfile.profilePicture?.url,
      },
    }));
  }

  // Get all ranked applicants with highlighted status
  @Get(':jobId/vetted-applicants')
  @UseGuards(AdminJwtGuard)
  async getVettedApplicants(@Param('jobId', ParseUUIDPipe) jobId: string) {
    // Get job to check if vetting is completed
    const job = await this.jobsService.getJobById(jobId);

    if (!job.vettingCompletedAt) {
      return {
        success: false,
        message: 'Vetting not completed for this job',
        vettingCompleted: false,
      };
    }

    // Get all applications with jobseeker profiles
    const applications = await this.applicationRepo.find({
      where: { jobId },
      relations: [
        'jobseekerProfile',
        'jobseekerProfile.userSkills',
        'jobseekerProfile.userSkills.skill',
      ],
      order: { createdAt: 'DESC' },
    });

    // Re-run vetting to get scores (since they're not stored persistently yet)
    const vettingResult =
      await this.jobVettingService.vetJobApplications(jobId);

    return {
      success: true,
      vettingCompleted: true,
      vettingCompletedAt: job.vettingCompletedAt,
      highlightedCandidateCount: job.highlightedCandidateCount,
      applications: vettingResult.vettedApplicants.map((vettedApp) => {
        // Find the corresponding application with properly loaded relations
        const application = applications.find(
          (app) => app.id === vettedApp.applicationId,
        );

        if (!application) {
          throw new Error(`Application ${vettedApp.applicationId} not found`);
        }

        return {
          applicationId: vettedApp.applicationId,
          jobseekerProfileId: application.jobseekerProfile.id,
          score: vettedApp.score,
          isHighlighted: vettedApp.isHighlighted,
          profileCompleteness: vettedApp.profileCompleteness,
          proximityScore: vettedApp.proximityScore,
          experienceScore: vettedApp.experienceScore,
          skillMatchScore: vettedApp.skillMatchScore,
          applicationSpeedScore: vettedApp.applicationSpeedScore,
          isEmployed: vettedApp.isEmployed,
          status: application.status,
          screeningMeetingLink: application.screeningMeetingLink,
          screeningScheduledAt: application.screeningScheduledAt,
          screeningDurationMinutes: application.screeningDurationMinutes,
          employerWillJoinScreening: application.employerWillJoinScreening,
          adminProposedScreeningTime: application.adminProposedScreeningTime,
          employerProposedScreeningTime:
            application.employerProposedScreeningTime,
          employerAccepted: application.employerAccepted,
          adminAccepted: application.adminAccepted,
          createdAt: application.createdAt,
          jobseekerProfile: {
            id: application.jobseekerProfile.id,
            firstName: application.jobseekerProfile.firstName,
            lastName: application.jobseekerProfile.lastName,
            email: application.jobseekerProfile.email,
            yearsOfExperience: application.jobseekerProfile.yearsOfExperience,
            city: application.jobseekerProfile.city,
            state: application.jobseekerProfile.state,
            skills: (application.jobseekerProfile.userSkills || []).map(
              (us) => ({
                id: us.skill.id,
                name: us.skill.name,
                proficiency: us.proficiency,
                yearsExperience: us.yearsExperience,
              }),
            ),
          },
        };
      }),
    };
  }

  // Adjust number of highlighted candidates
  @Patch(':jobId/highlighted-count')
  @UseGuards(AdminJwtGuard)
  async adjustHighlightedCount(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: AdjustHighlightedCountDto,
  ) {
    const { count } = dto;

    if (count < 1 || count > 10) {
      return {
        success: false,
        message: 'Highlighted count must be between 1 and 10',
      };
    }

    await this.jobsService.updateJob(jobId, {
      highlightedCandidateCount: count,
    } as any);

    return {
      success: true,
      message: `Highlighted candidate count updated to ${count}`,
      highlightedCount: count,
    };
  }

  // Select candidates for screening
  @Post(':jobId/select-for-screening')
  @UseGuards(AdminJwtGuard)
  async selectCandidatesForScreening(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: SelectCandidatesForScreeningDto,
  ) {
    const { candidates } = dto;

    if (!candidates || candidates.length === 0) {
      return {
        success: false,
        message: 'No candidates provided',
      };
    }

    // Validate all required fields (including durationMinutes)
    for (const candidate of candidates) {
      if (
        !candidate.applicationId ||
        !candidate.meetingLink ||
        !candidate.scheduledAt ||
        candidate.durationMinutes === undefined ||
        candidate.durationMinutes === null
      ) {
        return {
          success: false,
          message:
            'Each candidate must have applicationId, meetingLink, scheduledAt, and durationMinutes',
        };
      }
    }

    // Load job once to determine if employer will join screening (custom screening)
    const job = await this.jobsService.getJobById(jobId);
    const employerWillJoinScreening = !!job.performCustomScreening;

    // Update each application with screening details and admin proposal snapshot
    for (const candidate of candidates) {
      await this.applicationRepo.update(
        { id: candidate.applicationId },
        {
          status: JobApplicationStatus.SELECTED_FOR_SCREENING,
          screeningMeetingLink: candidate.meetingLink,
          screeningScheduledAt: new Date(candidate.scheduledAt),
          screeningPrepInfo: candidate.prepInfo ?? undefined,
          screeningDurationMinutes: candidate.durationMinutes,
          employerWillJoinScreening,
          adminProposedScreeningTime: new Date(candidate.scheduledAt),
          adminAccepted: true,
        },
      );
    }

    // Send notifications to candidates with meeting details
    await this.jobVettingService.notifyCandidatesForScreening(
      candidates.map((c) => c.applicationId),
    );

    return {
      success: true,
      message: `${candidates.length} candidates selected for screening and notified`,
      selectedCount: candidates.length,
    };
  }

  // Mark screening as complete
  @Post(':jobId/complete-screening')
  @UseGuards(AdminJwtGuard)
  async completeScreening(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: CompleteScreeningDto,
  ) {
    const { applicationIds } = dto;

    if (!applicationIds || applicationIds.length === 0) {
      return {
        success: false,
        message: 'No application IDs provided',
      };
    }

    // Send completion notifications to candidates
    await this.jobVettingService.notifyCandidatesAfterScreening(applicationIds);

    return {
      success: true,
      message: `Screening completion notifications sent to ${applicationIds.length} candidates`,
      notifiedCount: applicationIds.length,
    };
  }
}
