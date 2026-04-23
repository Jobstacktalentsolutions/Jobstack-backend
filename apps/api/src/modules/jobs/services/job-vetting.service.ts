import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Job,
  JobApplication,
  JobSeekerProfile,
  Employee,
  EmployerProfile,
} from '@app/common/database/entities';
import {
  JobApplicationStatus,
  SkillCategory,
  EmployeeStatus,
  SkillType,
  getSkillTypeFromCategory,
  NotificationPriority,
} from '@app/common/database/entities/schema.enum';
import {
  VETTING_CONFIG,
  getHighlightedCandidateCount,
} from '../config/vetting.config';
import { NotificationService } from '../../notification/notification.service';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

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
    @InjectRepository(EmployerProfile)
    private readonly employerRepo: Repository<EmployerProfile>,
    private readonly notificationService: NotificationService,
  ) {}

  // Main vetting method - orchestrates scoring and highlighting
  async vetJobApplications(jobId: string): Promise<VettingResult> {
    this.logger.log(`Starting vetting process for job ${jobId}`);

    // Get job with relations
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['skills', 'applications'],
    });

    if (!job) {
      this.logger.error(`Job ${jobId} not found during vetting`);
      throw new Error(`Job ${jobId} not found`);
    }

    this.logger.debug(
      `Job ${jobId} loaded with ${job.skills?.length || 0} skills and ${job.applications?.length || 0} applications`,
    );

    // Get all applications for this job (with profiles and skills for scoring)
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

    // Calculate or reuse scores for all relevant applications
    const vettedApplicants = await this.calculateAndPersistVettingScores(
      job,
      applications,
    );

    // Highlight top candidates and persist highlight flags
    const highlightedCount = this.applyHighlighting(
      job,
      vettedApplicants,
      applications,
    );

    // Persist updated vetting data and statuses in a single save where possible
    await this.applicationRepo.save(applications);
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

  // Calculate or reuse scores for all non-employed applications and persist them on entities
  private async calculateAndPersistVettingScores(
    job: Job,
    applications: JobApplication[],
  ): Promise<VettingResult['vettedApplicants']> {
    const vettedApplicants: VettedApplicant[] = [];

    for (const application of applications) {
      // Skip if profile is missing
      if (!application.jobseekerProfile) {
        this.logger.warn(
          `Application ${application.id} missing jobseeker profile, skipping`,
        );
        continue;
      }

      const isEmployed = await this.checkNotAlreadyEmployed(
        application.jobseekerProfileId,
      );

      // Skip employed applicants when building vetting results
      if (isEmployed) {
        this.logger.debug(
          `Skipping employed applicant ${application.jobseekerProfileId}`,
        );
        continue;
      }

      // Decide whether to recompute scores or reuse existing persisted scores
      const needsRecompute =
        !application.vettingScore ||
        !application.vettedAt ||
        (job.vettingCompletedAt &&
          application.createdAt > job.vettingCompletedAt);

      let score =
        application.vettingScore !== null &&
        application.vettingScore !== undefined
          ? Number(application.vettingScore)
          : 0;
      let profileCompleteness =
        application.vettingProfileCompleteness ?? undefined;
      let proximityScore = application.vettingProximityScore ?? undefined;
      let experienceScore = application.vettingExperienceScore ?? undefined;
      let skillMatchScore = application.vettingSkillMatchScore ?? undefined;
      let applicationSpeedScore =
        application.vettingApplicationSpeedScore ?? undefined;

      if (needsRecompute) {
        // Recalculate scores when there is no previous vetting or this is a new application
        profileCompleteness = this.calculateProfileCompleteness(
          application.jobseekerProfile,
        );
        proximityScore = this.calculateProximityScore(
          job,
          application.jobseekerProfile,
        );
        experienceScore = this.calculateExperienceScore(
          application.jobseekerProfile,
          job,
        );
        skillMatchScore = this.calculateSkillMatchScore(
          application.jobseekerProfile,
          job,
        );
        applicationSpeedScore = this.calculateApplicationSpeedScore(
          application,
          job,
        );
        score = await this.calculateApplicantScore(application, job);

        // Persist the recalculated scores on the application entity
        application.vettingScore = score;
        application.vettingProfileCompleteness = profileCompleteness;
        application.vettingProximityScore = proximityScore;
        application.vettingExperienceScore = experienceScore;
        application.vettingSkillMatchScore = skillMatchScore;
        application.vettingApplicationSpeedScore = applicationSpeedScore;
        application.vettedAt = new Date();
      }

      vettedApplicants.push({
        applicationId: application.id,
        jobseekerProfileId: application.jobseekerProfileId,
        score,
        isHighlighted: false, // Will be set in highlighting step
        profileCompleteness: profileCompleteness ?? 0,
        proximityScore: proximityScore ?? 0,
        experienceScore: experienceScore ?? 0,
        skillMatchScore: skillMatchScore ?? 0,
        applicationSpeedScore: applicationSpeedScore ?? 0,
        isEmployed,
      });
    }

    return vettedApplicants;
  }

  // Highlight top candidates based on score and update entities
  private applyHighlighting(
    job: Job,
    vettedApplicants: VettedApplicant[],
    applications: JobApplication[],
  ): number {
    // Sort by score (highest first)
    vettedApplicants.sort((a, b) => b.score - a.score);

    // Determine how many candidates should be highlighted
    const highlightedCount = getHighlightedCandidateCount(
      job.highlightedCandidateCount,
    );

    for (let i = 0; i < vettedApplicants.length; i++) {
      const va = vettedApplicants[i];
      const isHighlighted = i < highlightedCount;
      va.isHighlighted = isHighlighted;

      // Persist highlight flag alongside scores on corresponding entity
      const application = applications.find(
        (app) => app.id === va.applicationId,
      );
      if (application) {
        application.vettingIsHighlighted = isHighlighted;
      }
    }

    return highlightedCount;
  }

  /**
   * Calculate overall applicant score based on job category
   */
  private async calculateApplicantScore(
    application: JobApplication,
    job: Job,
  ): Promise<number> {
    const profile = application.jobseekerProfile;

    if (!profile) {
      this.logger.error(
        `Cannot calculate score for application ${application.id}: missing profile`,
      );
      return 0;
    }

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
   * Vetting-style fit score (0–100) for a profile vs a published job without an application; uses full application-speed weight as neutral 100.
   */
  computeMatchScoreForPublishedJob(
    job: Job,
    profile: JobSeekerProfile,
  ): number {
    if (!job || !profile) {
      this.logger.warn(
        'computeMatchScoreForPublishedJob called with missing job or profile',
      );
      return 0;
    }

    const profileCompleteness = this.calculateProfileCompleteness(profile);
    const proximityScore = this.calculateProximityScore(job, profile);
    const experienceScore = this.calculateExperienceScore(profile, job);
    const skillMatchScore = this.calculateSkillMatchScore(profile, job);
    const applicationSpeedScore = 100;

    const skillType = getSkillTypeFromCategory(job.category);
    if (skillType === SkillType.HIGH_SKILL) {
      const weights = VETTING_CONFIG.highSkillWeights;
      const totalScore =
        experienceScore * weights.yearsOfExperience +
        skillMatchScore * weights.skillMatching +
        profileCompleteness * weights.profileCompleteness +
        proximityScore * weights.proximity +
        applicationSpeedScore * weights.applicationSpeed;
      return Math.round(totalScore * 100) / 100;
    }

    const weights = VETTING_CONFIG.lowSkillWeights;
    const totalScore =
      applicationSpeedScore * weights.applicationSpeed +
      profileCompleteness * weights.profileCompleteness +
      experienceScore * weights.experience +
      proximityScore * weights.proximity;
    return Math.round(totalScore * 100) / 100;
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
   * Update application statuses after vetting.
   * Only updates APPLIED → VETTED. Preserves SELECTED_FOR_SCREENING and later
   * statuses so admin selections are not overwritten when vetted-applicants is fetched.
   */
  private async updateApplicationStatuses(
    vettedApplicants: VettedApplicant[],
  ): Promise<void> {
    const applicationIds = vettedApplicants.map((va) => va.applicationId);

    await this.applicationRepo.update(
      {
        id: In(applicationIds),
        status: JobApplicationStatus.APPLIED,
      },
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

        const employerWillJoin = true; // Employer always manages their own screenings

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
            screeningDurationMinutes:
              application.screeningDurationMinutes ?? null,
            employerWillJoin,
          },
        });

        // Also create in-app notification for the jobseeker
        try {
          await this.notificationService.createAppNotification(
            application.jobseekerProfileId,
            UserRole.JOB_SEEKER,
            {
              title: '🌟 Selected for Screening!',
              message: `You have been selected for a screening interview for "${application.job.title}" scheduled for ${formattedDate} at ${formattedTime}.`,
              priority: NotificationPriority.HIGH,
              metadata: {
                jobId: application.job.id,
                applicationId: application.id,
                meetingLink: application.screeningMeetingLink,
                scheduledAt: application.screeningScheduledAt,
              },
            },
          );
        } catch (appNotifErr) {
          this.logger.warn(
            `Failed to create in-app screening notification: ${appNotifErr.message}`,
          );
        }

        this.logger.log(
          `Screening notification sent to candidate ${application.jobseekerProfile.email}`,
        );

        // Always notify the employer — they are the ones who scheduled the screening
        if (application.job.employer) {
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

        // Also create in-app notification
        try {
          await this.notificationService.createAppNotification(
            application.jobseekerProfileId,
            UserRole.JOB_SEEKER,
            {
              title: 'Screening Completed',
              message: `Your screening for "${application.job.title}" is complete. Stay tuned for next steps from the employer.`,
              priority: NotificationPriority.MEDIUM,
              metadata: {
                jobId: application.job.id,
                applicationId: application.id,
              },
            },
          );
        } catch (appNotifErr) {
          this.logger.warn(
            `Failed to create in-app screening-complete notification: ${appNotifErr.message}`,
          );
        }

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
   * Send vetting completion notification to the employer whose job was vetted.
   * Previously notified admin; now employers manage the pipeline.
   */
  async notifyEmployerVettingComplete(
    jobId: string,
    result: VettingResult,
  ): Promise<void> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['employer'],
    });

    if (!job?.employer) {
      this.logger.error(
        `Job ${jobId} or its employer not found for vetting notification`,
      );
      return;
    }

    const websiteUrl = process.env.WEBSITE_URL ?? '';
    const dashboardUrl = websiteUrl
      ? `${websiteUrl}/employer/dashboard/jobs/${jobId}/candidates`
      : '';

    try {
      await this.notificationService.sendEmail({
        to: job.employer.email,
        subject: `Candidates ranked for "${job.title}" — Review them now`,
        template: 'vetting-complete',
        context: {
          jobTitle: job.title,
          jobId: job.id,
          totalApplicants: result.totalApplicants,
          highlightedCount: result.highlightedCount,
          dashboardUrl,
        },
      });

      await this.notificationService.createAppNotification(
        job.employerId,
        UserRole.EMPLOYER,
        {
          title: '📊 Candidates Ranked',
          message: `Your job "${job.title}" has ${result.totalApplicants} ranked applicants. ${result.highlightedCount} top candidates are highlighted. Review them now.`,
          priority: NotificationPriority.HIGH,
          metadata: {
            jobId: job.id,
            highlightedCount: result.highlightedCount,
          },
        },
      );

      this.logger.log(
        `Vetting completion notification sent to employer for job ${jobId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send vetting completion notification for job ${jobId}`,
        error,
      );
    }
  }

  /**
   * Returns the ranked vetted applicants for a job, gating PII fields based on
   * whether the employer has paid to unlock each candidate (application.piiUnlocked).
   * Only returns applications where vettingScore is set.
   */
  async getVettedApplicantsForEmployer(
    jobId: string,
    employerId: string,
  ): Promise<object> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId },
    });
    if (!job) {
      throw new NotFoundException('Job not found or you do not own this job');
    }

    // Trigger re-vetting for new/unvetted apps if needed
    if (job.vettingCompletedAt) {
      const hasNew = await this.applicationRepo.count({
        where: { jobId },
      });
      const unvetted = await this.applicationRepo
        .createQueryBuilder('a')
        .where('a.jobId = :jobId', { jobId })
        .andWhere('(a.vettingScore IS NULL OR a.vettedAt IS NULL)')
        .getCount();
      if (unvetted > 0 || hasNew > 0) {
        await this.vetJobApplications(jobId);
      }
    }

    if (!job.vettingCompletedAt) {
      return {
        success: false,
        vettingCompleted: false,
        message: 'Candidates are still being ranked. Check back soon.',
        applications: [],
      };
    }

    const applications = await this.applicationRepo.find({
      where: { jobId },
      relations: [
        'jobseekerProfile',
        'jobseekerProfile.userSkills',
        'jobseekerProfile.userSkills.skill',
      ],
      order: { vettingScore: 'DESC' },
    });

    return {
      success: true,
      vettingCompleted: true,
      vettingCompletedAt: job.vettingCompletedAt,
      highlightedCandidateCount: job.highlightedCandidateCount,
      applications: applications
        .filter(
          (app) => app.vettingScore !== null && app.vettingScore !== undefined,
        )
        .map((application) => {
          const profile = application.jobseekerProfile;
          const unlocked = application.piiUnlocked;
          return {
            applicationId: application.id,
            jobseekerProfileId: profile.id,
            score: application.vettingScore,
            isHighlighted: !!application.vettingIsHighlighted,
            profileCompleteness: application.vettingProfileCompleteness ?? 0,
            proximityScore: application.vettingProximityScore ?? 0,
            experienceScore: application.vettingExperienceScore ?? 0,
            skillMatchScore: application.vettingSkillMatchScore ?? 0,
            applicationSpeedScore:
              application.vettingApplicationSpeedScore ?? 0,
            status: application.status,
            piiUnlocked: unlocked,
            piiUnlockedAt: application.piiUnlockedAt ?? null,
            screeningMeetingLink: application.screeningMeetingLink,
            screeningScheduledAt: application.screeningScheduledAt,
            screeningDurationMinutes: application.screeningDurationMinutes,
            screeningStrengths: application.screeningStrengths,
            screeningConcerns: application.screeningConcerns,
            screeningInterviewFeedback: application.screeningInterviewFeedback,
            createdAt: application.createdAt,
            jobseekerProfile: {
              id: profile.id,
              firstName: profile.firstName,
              lastName: profile.lastName,
              // PII fields — masked until payment unlocks them
              email: unlocked ? profile.email : this.maskEmail(profile.email),
              phoneNumber: unlocked
                ? profile.phoneNumber
                : this.maskPhone(profile.phoneNumber),
              yearsOfExperience: profile.yearsOfExperience,
              city: profile.city,
              state: profile.state,
              skills: (profile.userSkills || []).map((us) => ({
                id: us.skill.id,
                name: us.skill.name,
              })),
            },
          };
        }),
    };
  }

  /**
   * Employer picks a candidate for hire (post-screening or direct hire).
   * This is a single atomic action that:
   *  1. Clears any previously picked application for this job.
   *  2. Marks the chosen application as SELECTED_FOR_HIRE.
   *  3. Creates an Employee record (piiUnlocked = true, since PII was already paid for).
   *  4. Advances application to OFFER_SENT and notifies the jobseeker.
   */
  async employerPickCandidate(
    jobId: string,
    employerId: string,
    dto: {
      applicationId: string;
      strengths?: string;
      concerns?: string;
      interviewFeedback?: string;
      startDate?: Date;
      notes?: string;
    },
  ): Promise<object> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId },
      relations: ['employer'],
    });
    if (!job) {
      throw new NotFoundException('Job not found or you do not own this job');
    }

    const application = await this.applicationRepo.findOne({
      where: { id: dto.applicationId, jobId },
      relations: ['jobseekerProfile'],
    });
    if (!application) {
      throw new NotFoundException('Application not found for this job');
    }

    // Must have PII unlocked before hiring
    if (!application.piiUnlocked) {
      throw new BadRequestException(
        "You must unlock this candidate's contact info before hiring them.",
      );
    }

    const allowedStatuses = [
      JobApplicationStatus.VETTED,
      JobApplicationStatus.SELECTED_FOR_SCREENING,
      JobApplicationStatus.SELECTED_FOR_HIRE,
    ];
    if (!allowedStatuses.includes(application.status)) {
      throw new BadRequestException(
        `Cannot select a candidate with status ${application.status}`,
      );
    }

    if (
      application.job?.employmentArrangement === 'PERMANENT_EMPLOYEE' &&
      !job.salary
    ) {
      throw new BadRequestException(
        'Job does not have a salary defined. Please update the job posting first.',
      );
    }
    if (
      application.job?.employmentArrangement === 'CONTRACT' &&
      !job.contractFee
    ) {
      throw new BadRequestException(
        'Job does not have a contract fee defined. Please update the job posting first.',
      );
    }

    // Validate no other active employee exists for this job+candidate combo
    const existingEmployee = await this.employeeRepo.findOne({
      where: {
        jobId,
        jobseekerProfileId: application.jobseekerProfileId,
        status: In([EmployeeStatus.ONBOARDING, EmployeeStatus.ACTIVE]),
      },
    });
    if (existingEmployee) {
      throw new BadRequestException(
        'An active employee record already exists for this candidate on this job.',
      );
    }

    await this.applicationRepo.manager.transaction(async (manager) => {
      // Clear any previously selected-for-hire application
      await manager.update(
        JobApplication,
        {
          jobId,
          status: In([
            JobApplicationStatus.SELECTED_FOR_HIRE,
            JobApplicationStatus.OFFER_SENT,
          ]),
        },
        {
          status: JobApplicationStatus.VETTED,
          screeningStrengths: null,
          screeningConcerns: null,
          screeningInterviewFeedback: null,
        },
      );

      // Advance the chosen application
      await manager.update(
        JobApplication,
        { id: dto.applicationId },
        {
          status: JobApplicationStatus.OFFER_SENT,
          statusUpdatedAt: new Date(),
          screeningStrengths: dto.strengths ?? null,
          screeningConcerns: dto.concerns ?? null,
          screeningInterviewFeedback: dto.interviewFeedback ?? null,
        },
      );

      // Create Employee record — PII is already unlocked via payment
      const employeeManager = manager.getRepository(Employee);
      await employeeManager.save(
        employeeManager.create({
          employerId,
          jobId,
          jobseekerProfileId: application.jobseekerProfileId,
          employmentType: job.employmentType,
          employmentArrangement: job.employmentArrangement,
          status: EmployeeStatus.ONBOARDING,
          salaryOffered:
            job.employmentArrangement === 'PERMANENT_EMPLOYEE'
              ? job.salary
              : undefined,
          contractFeeOffered:
            job.employmentArrangement === 'CONTRACT'
              ? job.contractFee
              : undefined,
          contractPaymentType:
            job.employmentArrangement === 'CONTRACT'
              ? job.contractPaymentType
              : undefined,
          currency: 'NGN',
          startDate: dto.startDate,
          notes: dto.notes,
          piiUnlocked: true, // PII already paid for at application level
        }),
      );
    });

    // Notify jobseeker about the offer
    try {
      await this.notificationService.createAppNotification(
        application.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: '🎉 Job Offer Received!',
          message: `You have received a job offer for "${job.title}". Please review and respond within 7 days.`,
          priority: NotificationPriority.HIGH,
          metadata: { jobId, applicationId: dto.applicationId },
        },
      );
    } catch (err) {
      this.logger.warn(`Failed to notify jobseeker of offer: ${err.message}`);
    }

    return {
      success: true,
      message: 'Candidate selected for hire. Offer sent to jobseeker.',
      applicationId: dto.applicationId,
    };
  }

  // --- Private helpers for PII masking in employer view ---

  private maskEmail(email?: string): string {
    if (!email || !email.includes('@')) return '****@****.***';
    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }

  private maskPhone(phone?: string): string {
    if (!phone || phone.length < 6) return '****';
    return `${phone.substring(0, 4)} **** ${phone.substring(phone.length - 2)}`;
  }
}
