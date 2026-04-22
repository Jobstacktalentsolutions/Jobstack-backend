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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminJwtGuard, RequireAdminRole } from 'apps/api/src/guards';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { JobsService } from '../services/jobs.service';
import { JobVettingService } from '../services/job-vetting.service';
import { AdminReplacementService } from '../services/admin-replacement.service';
import {
  JobQueryDto,
  UpdateJobDto,
  UpdateJobStatusDto,
} from '../dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Job, JobApplication } from '@app/common/database/entities';

@ApiTags('Jobs (admin)')
@ApiBearerAuth()
@Controller('jobs/admin')
export class JobsAdminController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobVettingService: JobVettingService,
    private readonly adminReplacementService: AdminReplacementService,
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
  @ApiOperation({ summary: 'Update a job (admin)' })
  @ApiBody({ type: UpdateJobDto })
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
  @ApiOperation({ summary: 'Update job status (operations)' })
  @ApiBody({ type: UpdateJobStatusDto })
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

  // Get all applications for a job (admin read-only view)
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
      piiUnlocked: app.piiUnlocked,
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

    // Get all applications with jobseeker profiles (for response shaping)
    const applications = await this.applicationRepo.find({
      where: { jobId },
      relations: [
        'jobseekerProfile',
        'jobseekerProfile.userSkills',
        'jobseekerProfile.userSkills.skill',
      ],
      order: { createdAt: 'DESC' },
    });

    // Check if there are new or unvetted applications that require re-vetting
    const hasNewApplications =
      job.vettingCompletedAt &&
      (await this.applicationRepo.count({
        where: {
          jobId,
          createdAt: MoreThan(job.vettingCompletedAt),
        },
      })) > 0;

    const hasUnvettedApplications = applications.some(
      (app) => !app.vettingScore || !app.vettedAt,
    );

    // Only rerun vetting when needed; otherwise rely on stored scores
    if (hasNewApplications || hasUnvettedApplications) {
      await this.jobVettingService.vetJobApplications(jobId);
    }

    return {
      success: true,
      vettingCompleted: true,
      vettingCompletedAt: job.vettingCompletedAt,
      highlightedCandidateCount: job.highlightedCandidateCount,
      applications: applications
        .filter(
          (app) => app.vettingScore !== null && app.vettingScore !== undefined,
        )
        .map((application) => ({
          applicationId: application.id,
          jobseekerProfileId: application.jobseekerProfile.id,
          score: application.vettingScore,
          isHighlighted: !!application.vettingIsHighlighted,
          profileCompleteness: application.vettingProfileCompleteness ?? 0,
          proximityScore: application.vettingProximityScore ?? 0,
          experienceScore: application.vettingExperienceScore ?? 0,
          skillMatchScore: application.vettingSkillMatchScore ?? 0,
          applicationSpeedScore: application.vettingApplicationSpeedScore ?? 0,
          isEmployed: false, // Employment is checked during vetting; not persisted
          status: application.status,
          piiUnlocked: application.piiUnlocked,
          screeningMeetingLink: application.screeningMeetingLink,
          screeningScheduledAt: application.screeningScheduledAt,
          screeningDurationMinutes: application.screeningDurationMinutes,
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
              }),
            ),
          },
        })),
    };
  }

  // Get current active employee assigned to a job (admin view).
  @Get(':jobId/current-employee')
  @UseGuards(AdminJwtGuard)
  async getCurrentEmployee(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.adminReplacementService.getCurrentEmployee(jobId);
  }

  // Returns replacement candidates ranked: job-vetted first, then platform-vetted.
  @Get(':jobId/replacement-candidates')
  @UseGuards(AdminJwtGuard)
  async getReplacementCandidates(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit
      ? Math.min(50, Math.max(5, Number(limit)))
      : undefined;
    return this.adminReplacementService.getReplacementCandidates({
      jobId,
      search,
      limit: parsedLimit,
    });
  }

  // Swaps the active candidate on a job and starts fresh probation for the replacement.
  @Post(':jobId/replace-candidate')
  @UseGuards(AdminJwtGuard)
  async replaceCandidate(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() body: { newJobseekerProfileId: string },
  ) {
    return this.adminReplacementService.replaceCandidate(jobId, body);
  }
}
