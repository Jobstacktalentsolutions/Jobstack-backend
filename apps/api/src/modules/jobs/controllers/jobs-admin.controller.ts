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
import { JobQueryDto, UpdateJobDto, UpdateJobStatusDto } from '../dto';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JobApplication } from '@app/common/database/entities';

@Controller('jobs/admin')
export class JobsAdminController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobVettingService: JobVettingService,
    private readonly jobVettingProducer: JobVettingProducer,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
  ) {}

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
    const result = await this.jobVettingProducer.queueJobVetting(jobId, 'manual');
    return {
      success: true,
      message: 'Vetting job queued successfully',
      queueJobId: result.jobId,
    };
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
      relations: ['jobseekerProfile', 'jobseekerProfile.userSkills', 'jobseekerProfile.userSkills.skill'],
      order: { createdAt: 'DESC' },
    });

    // For now, we'll return basic info. In a real implementation, you'd store vetting results
    return {
      success: true,
      vettingCompleted: true,
      vettingCompletedAt: job.vettingCompletedAt,
      highlightedCandidateCount: job.highlightedCandidateCount,
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt,
        jobseekerProfile: {
          id: app.jobseekerProfile.id,
          firstName: app.jobseekerProfile.firstName,
          lastName: app.jobseekerProfile.lastName,
          email: app.jobseekerProfile.email,
          yearsOfExperience: app.jobseekerProfile.yearsOfExperience,
          city: app.jobseekerProfile.city,
          state: app.jobseekerProfile.state,
          skills: app.jobseekerProfile.userSkills?.map(us => ({
            id: us.skill.id,
            name: us.skill.name,
            proficiency: us.proficiency,
            yearsExperience: us.yearsExperience,
          })) || [],
        },
      })),
    };
  }

  // Adjust number of highlighted candidates
  @Patch(':jobId/highlighted-count')
  @UseGuards(AdminJwtGuard)
  async adjustHighlightedCount(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() body: { count: number },
  ) {
    const { count } = body;
    
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
    @Body() body: { 
      candidates: Array<{
        applicationId: string;
        meetingLink: string;
        scheduledAt: string; // ISO date string
        prepInfo?: string;
      }>;
    },
  ) {
    const { candidates } = body;
    
    if (!candidates || candidates.length === 0) {
      return {
        success: false,
        message: 'No candidates provided',
      };
    }

    // Validate all required fields
    for (const candidate of candidates) {
      if (!candidate.applicationId || !candidate.meetingLink || !candidate.scheduledAt) {
        return {
          success: false,
          message: 'Each candidate must have applicationId, meetingLink, and scheduledAt',
        };
      }
    }

    // Update each application with screening details
    for (const candidate of candidates) {
      await this.applicationRepo.update(
        { id: candidate.applicationId },
        {
          status: JobApplicationStatus.SELECTED_FOR_SCREENING,
          screeningMeetingLink: candidate.meetingLink,
          screeningScheduledAt: new Date(candidate.scheduledAt),
          screeningPrepInfo: candidate.prepInfo || null,
        }
      );
    }

    // Send notifications to candidates with meeting details
    await this.jobVettingService.notifyCandidatesForScreening(
      candidates.map(c => c.applicationId)
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
    @Body() body: { applicationIds: string[] },
  ) {
    const { applicationIds } = body;
    
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
