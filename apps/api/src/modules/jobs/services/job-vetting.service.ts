import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Job,
  JobApplication,
  JobSeekerProfile,
  Employee,
} from '@app/common/database/entities';
import {
  JobApplicationStatus,
  SkillCategory,
  EmployeeStatus,
  SkillType,
  getSkillTypeFromCategory,
} from '@app/common/database/entities/schema.enum';
import {
  VETTING_CONFIG,
  getHighlightedCandidateCount,
} from '../config/vetting.config';
import { NotificationService } from '../../notification/notification.service';

export interface VettingResult {
  jobId: string;
  totalApplicants: number;
  highlightedCount: number;
  vettedApplicants: VettedApplicant[];
}

export interface VettedApplicant {
  applicationId: string;
  jobseekerProfileId: string;
  score: number;
  isHighlighted: boolean;
  profileCompleteness: number;
  proximityScore: number;
  experienceScore: number;
  skillMatchScore: number;
  applicationSpeedScore: number;
  isEmployed: boolean;
}

@Injectable()
export class JobVettingService {
  private readonly logger = new Logger(JobVettingService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(JobSeekerProfile)
    private readonly profileRepo: Repository<JobSeekerProfile>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Main vetting method - ranks ALL applicants and highlights top N
   */
  async vetJobApplications(jobId: string): Promise<VettingResult> {
    this.logger.log(`Starting vetting process for job ${jobId}`);

    // Get job with relations
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['skills', 'applications'],
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Get all applications for this job
    const applications = await this.applicationRepo.find({
      where: { jobId },
      relations: [
        'jobseekerProfile',
        'jobseekerProfile.userSkills',
        'jobseekerProfile.userSkills.skill',
      ],
    });

    if (applications.length === 0) {
      this.logger.log(`No applications found for job ${jobId}`);
      return {
        jobId,
        totalApplicants: 0,
        highlightedCount: 0,
        vettedApplicants: [],
      };
    }

    // Filter out employed applicants and score the rest
    const vettedApplicants: VettedApplicant[] = [];

    for (const application of applications) {
      const isEmployed = await this.checkNotAlreadyEmployed(
        application.jobseekerProfileId,
      );

      // Skip employed applicants
      if (isEmployed) {
        this.logger.debug(
          `Skipping employed applicant ${application.jobseekerProfileId}`,
        );
        continue;
      }

      const score = await this.calculateApplicantScore(application, job);
      const profileCompleteness = this.calculateProfileCompleteness(
        application.jobseekerProfile,
      );
      const proximityScore = this.calculateProximityScore(
        job,
        application.jobseekerProfile,
      );
      const experienceScore = this.calculateExperienceScore(
        application.jobseekerProfile,
        job,
      );
      const skillMatchScore = this.calculateSkillMatchScore(
        application.jobseekerProfile,
        job,
      );
      const applicationSpeedScore = this.calculateApplicationSpeedScore(
        application,
        job,
      );

      vettedApplicants.push({
        applicationId: application.id,
        jobseekerProfileId: application.jobseekerProfileId,
        score,
        isHighlighted: false, // Will be set later
        profileCompleteness,
        proximityScore,
        experienceScore,
        skillMatchScore,
        applicationSpeedScore,
        isEmployed,
      });
    }

    // Sort by score (highest first)
    vettedApplicants.sort((a, b) => b.score - a.score);

    // Highlight top candidates
    const highlightedCount = getHighlightedCandidateCount(
      job.performCustomScreening,
      job.highlightedCandidateCount,
    );

    for (
      let i = 0;
      i < Math.min(highlightedCount, vettedApplicants.length);
      i++
    ) {
      vettedApplicants[i].isHighlighted = true;
    }

    // Update application statuses
    await this.updateApplicationStatuses(vettedApplicants);

    // Update job vetting completion
    await this.jobRepo.update(jobId, {
      vettingCompletedAt: new Date(),
      vettingCompletedBy: 'system',
    });

    this.logger.log(
      `Vetting completed for job ${jobId}. ${vettedApplicants.length} applicants processed, ${highlightedCount} highlighted`,
    );

    return {
      jobId,
      totalApplicants: vettedApplicants.length,
      highlightedCount,
      vettedApplicants,
    };
  }

  /**
   * Calculate overall applicant score based on job category
   */
  private async calculateApplicantScore(
    application: JobApplication,
    job: Job,
  ): Promise<number> {
    const profile = application.jobseekerProfile;

    const profileCompleteness = this.calculateProfileCompleteness(profile);
    const proximityScore = this.calculateProximityScore(job, profile);
    const experienceScore = this.calculateExperienceScore(profile, job);
    const skillMatchScore = this.calculateSkillMatchScore(profile, job);
    const applicationSpeedScore = this.calculateApplicationSpeedScore(
      application,
      job,
    );

    let totalScore = 0;

    const skillType = getSkillTypeFromCategory(job.category);
    if (skillType === SkillType.HIGH_SKILL) {
      // High-skill job scoring
      const weights = VETTING_CONFIG.highSkillWeights;
      totalScore =
        experienceScore * weights.yearsOfExperience +
        skillMatchScore * weights.skillMatching +
        profileCompleteness * weights.profileCompleteness +
        proximityScore * weights.proximity +
        applicationSpeedScore * weights.applicationSpeed;
    } else {
      // Low-skill job scoring
      const weights = VETTING_CONFIG.lowSkillWeights;
      totalScore =
        applicationSpeedScore * weights.applicationSpeed +
        profileCompleteness * weights.profileCompleteness +
        experienceScore * weights.experience +
        proximityScore * weights.proximity;
    }

    return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate profile completeness percentage (0-100)
   */
  calculateProfileCompleteness(profile: JobSeekerProfile): number {
    const weights = VETTING_CONFIG.profileCompletenessWeights;
    let score = 0;

    // Basic info (name, email, phone) - required fields, so always present
    score += weights.basicInfo * 100;

    // Location
    const hasLocation =
      profile.state ||
      profile.city ||
      profile.address ||
      profile.preferredLocation;
    if (hasLocation) {
      score += weights.location * 100;
    }

    // CV document
    if (profile.cvDocumentId) {
      score += weights.cvDocument * 100;
    }

    // Profile picture
    if (profile.profilePictureId) {
      score += weights.profilePicture * 100;
    }

    // Skills (at least 1 skill)
    if (profile.userSkills && profile.userSkills.length > 0) {
      score += weights.skills * 100;
    }

    // Years of experience
    if (
      profile.yearsOfExperience !== null &&
      profile.yearsOfExperience !== undefined
    ) {
      score += weights.yearsOfExperience * 100;
    }

    // Job title
    if (profile.jobTitle) {
      score += weights.jobTitle * 100;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate proximity score based on location matching (0-100)
   * Emphasizes LGA/city matching for low-skill jobs
   */
  private calculateProximityScore(job: Job, profile: JobSeekerProfile): number {
    // If no location info available, return neutral score
    if (!job.state && !job.city) {
      return 50;
    }

    let score = 0;

    // City matching (treated as LGA equivalent for local proximity)
    if (job.city && profile.city) {
      if (job.city.toLowerCase().trim() === profile.city.toLowerCase().trim()) {
        // Same city/LGA - highest priority
        score = 100;
        return score;
      }
    }

    // State match (if cities don't match or aren't available)
    if (job.state && profile.state) {
      if (
        job.state.toLowerCase().trim() === profile.state.toLowerCase().trim()
      ) {
        score += 50;

        // Partial city match bonus
        if (job.city && profile.city) {
          const jobCityLower = job.city.toLowerCase();
          const profileCityLower = profile.city.toLowerCase();
          // Check if cities are related (contain each other)
          if (
            jobCityLower.includes(profileCityLower) ||
            profileCityLower.includes(jobCityLower)
          ) {
            score += 25;
          }
        }
      }
    }

    // Check preferred location as fallback
    if (score === 0 && profile.preferredLocation) {
      const preferredLower = profile.preferredLocation.toLowerCase();

      if (job.city && preferredLower.includes(job.city.toLowerCase())) {
        score += 35;
      } else if (
        job.state &&
        preferredLower.includes(job.state.toLowerCase())
      ) {
        score += 25;
      }
    }

    // Check address for additional locality hints
    if (score < 100 && job.address && profile.address) {
      const jobAddressLower = job.address.toLowerCase();
      const profileAddressLower = profile.address.toLowerCase();

      // Look for common locality markers in addresses
      if (
        jobAddressLower.includes(profileAddressLower.split(',')[0]) ||
        profileAddressLower.includes(jobAddressLower.split(',')[0])
      ) {
        score += 15;
      }
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate experience score based on years of experience (0-100)
   */
  private calculateExperienceScore(
    profile: JobSeekerProfile,
    job: Job,
  ): number {
    if (!profile.yearsOfExperience) {
      return 0;
    }

    // For high-skill jobs, more experience is better
    const skillType = getSkillTypeFromCategory(job.category);
    if (skillType === SkillType.HIGH_SKILL) {
      // Score based on experience level
      if (profile.yearsOfExperience >= 10) return 100;
      if (profile.yearsOfExperience >= 5) return 80;
      if (profile.yearsOfExperience >= 3) return 60;
      if (profile.yearsOfExperience >= 1) return 40;
      return 20;
    } else {
      // For low-skill jobs, some experience is good but not critical
      if (profile.yearsOfExperience >= 3) return 100;
      if (profile.yearsOfExperience >= 1) return 80;
      if (profile.yearsOfExperience > 0) return 60;
      return 40; // No experience is still okay for low-skill
    }
  }

  /**
   * Calculate skill matching score (0-100)
   */
  private calculateSkillMatchScore(
    profile: JobSeekerProfile,
    job: Job,
  ): number {
    if (!job.skills || job.skills.length === 0) {
      return 50; // Neutral score if no required skills
    }

    if (!profile.userSkills || profile.userSkills.length === 0) {
      return 0; // No skills listed
    }

    const jobSkillIds = new Set(job.skills.map((skill) => skill.id));
    const userSkillIds = new Set(profile.userSkills.map((us) => us.skillId));

    // Calculate intersection
    const matchingSkills = [...jobSkillIds].filter((skillId) =>
      userSkillIds.has(skillId),
    );
    const matchPercentage = matchingSkills.length / job.skills.length;

    return Math.round(matchPercentage * 100);
  }

  /**
   * Calculate application speed score (0-100)
   */
  private calculateApplicationSpeedScore(
    application: JobApplication,
    job: Job,
  ): number {
    const jobCreatedAt = new Date(job.createdAt);
    const applicationCreatedAt = new Date(application.createdAt);

    const hoursDiff =
      (applicationCreatedAt.getTime() - jobCreatedAt.getTime()) /
      (1000 * 60 * 60);

    if (hoursDiff < 0) {
      return 0; // Application created before job (shouldn't happen)
    }

    const config = VETTING_CONFIG.applicationSpeed;

    if (hoursDiff <= config.maxHoursForFullScore) {
      return 100;
    }

    const score = Math.max(
      0,
      100 -
        (hoursDiff - config.maxHoursForFullScore) * config.scoreDecayPerHour,
    );
    return Math.round(score);
  }

  /**
   * Check if applicant is not currently employed
   */
  async checkNotAlreadyEmployed(profileId: string): Promise<boolean> {
    const activeEmployment = await this.employeeRepo.findOne({
      where: {
        jobseekerProfileId: profileId,
        status: EmployeeStatus.ACTIVE,
      },
    });

    return !!activeEmployment; // Returns true if employed
  }

  /**
   * Update application statuses after vetting
   */
  private async updateApplicationStatuses(
    vettedApplicants: VettedApplicant[],
  ): Promise<void> {
    const applicationIds = vettedApplicants.map((va) => va.applicationId);

    await this.applicationRepo.update(
      { id: In(applicationIds) },
      { status: JobApplicationStatus.VETTED },
    );
  }

  /**
   * Notify candidates when selected for screening
   */
  async notifyCandidatesForScreening(applicationIds: string[]): Promise<void> {
    const applications = await this.applicationRepo.find({
      where: { id: In(applicationIds) },
      relations: ['jobseekerProfile', 'job', 'job.employer'],
    });

    for (const application of applications) {
      if (
        !application.screeningMeetingLink ||
        !application.screeningScheduledAt
      ) {
        this.logger.warn(
          `Application ${application.id} missing meeting details, skipping notification`,
        );
        continue;
      }

      try {
        // Format the scheduled date/time
        const scheduledDate = new Date(application.screeningScheduledAt);
        const formattedDate = scheduledDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        });

        const employerWillJoin = application.job.performCustomScreening;

        // Send email to candidate
        await this.notificationService.sendEmail({
          to: application.jobseekerProfile.email,
          subject: 'You have been selected for screening',
          template: 'candidate-selected-for-screening',
          context: {
            candidateName: `${application.jobseekerProfile.firstName} ${application.jobseekerProfile.lastName}`,
            jobTitle: application.job.title,
            jobId: application.job.id,
            meetingLink: application.screeningMeetingLink,
            scheduledDate: formattedDate,
            scheduledTime: formattedTime,
            scheduledDateTime: `${formattedDate} at ${formattedTime}`,
            prepInfo: application.screeningPrepInfo || null,
            employerWillJoin,
          },
        });

        this.logger.log(
          `Screening notification sent to candidate ${application.jobseekerProfile.email}`,
        );

        // If custom screening, also notify the employer
        if (employerWillJoin && application.job.employer) {
          await this.notificationService.sendEmail({
            to: application.job.employer.email,
            subject: `Screening scheduled for ${application.job.title}`,
            template: 'employer-screening-invitation',
            context: {
              employerName: `${application.job.employer.firstName} ${application.job.employer.lastName}`,
              jobTitle: application.job.title,
              jobId: application.job.id,
              candidateName: `${application.jobseekerProfile.firstName} ${application.jobseekerProfile.lastName}`,
              applicationId: application.id,
              meetingLink: application.screeningMeetingLink,
              scheduledDate: formattedDate,
              scheduledTime: formattedTime,
              scheduledDateTime: `${formattedDate} at ${formattedTime}`,
              prepInfo: application.screeningPrepInfo || null,
            },
          });

          this.logger.log(
            `Screening notification sent to employer ${application.job.employer.email}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to send screening notification for application ${application.id}`,
          error,
        );
      }
    }
  }

  /**
   * Notify candidates after external screening is completed
   */
  async notifyCandidatesAfterScreening(
    applicationIds: string[],
  ): Promise<void> {
    const applications = await this.applicationRepo.find({
      where: { id: In(applicationIds) },
      relations: ['jobseekerProfile', 'job'],
    });

    for (const application of applications) {
      try {
        await this.notificationService.sendEmail({
          to: application.jobseekerProfile.email,
          subject: 'Screening completed - Next steps',
          template: 'candidate-screening-completed',
          context: {
            candidateName: `${application.jobseekerProfile.firstName} ${application.jobseekerProfile.lastName}`,
            jobTitle: application.job.title,
            jobId: application.job.id,
          },
        });

        this.logger.log(
          `Screening completion notification sent to ${application.jobseekerProfile.email}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send screening completion notification to ${application.jobseekerProfile.email}`,
          error,
        );
      }
    }
  }

  /**
   * Send vetting completion notification to admin
   */
  async notifyAdminVettingComplete(
    jobId: string,
    result: VettingResult,
  ): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['employer'],
    });

    if (!job) {
      this.logger.error(`Job ${jobId} not found for admin notification`);
      return;
    }

    try {
      // For now, we'll send to a generic admin email or the employer
      // In a real system, you'd have admin user management
      const adminEmail = process.env.ADMIN_EMAIL || job.employer.email;

      await this.notificationService.sendEmail({
        to: adminEmail,
        subject: `Vetting completed for ${job.title}`,
        template: 'vetting-complete',
        context: {
          jobTitle: job.title,
          jobId: job.id,
          totalApplicants: result.totalApplicants,
          highlightedCount: result.highlightedCount,
          dashboardUrl: `${process.env.WEBSITE_URL}/admin/jobs/${jobId}/vetted-applicants`,
        },
      });

      this.logger.log(
        `Vetting completion notification sent to admin for job ${jobId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send vetting completion notification for job ${jobId}`,
        error,
      );
    }
  }
}
