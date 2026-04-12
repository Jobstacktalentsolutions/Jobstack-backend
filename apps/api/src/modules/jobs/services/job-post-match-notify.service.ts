import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Job, JobSeekerProfile } from '@app/common/database/entities';
import {
  ApprovalStatus,
  isJobOpenOnMarketplace,
  JobStatus,
} from '@app/common/database/entities/schema.enum';
import { NotificationService } from '../../notification/notification.service';
import { JobVettingService } from './job-vetting.service';
import { JOB_POST_MATCH_CONFIG } from '../config/job-post-match.config';
import { computeTextMatchScore } from '../utils/job-text-match.util';
import { ENV } from '../../config';
import { EmailTemplateType } from '../../notification/email/email-notification.enum';

interface ScoredProfile {
  profile: JobSeekerProfile;
  combinedScore: number;
}

/**
 * Finds jobseekers who match a published job (vetting-style score + text match) and emails them.
 */
@Injectable()
export class JobPostMatchNotifyService {
  private readonly logger = new Logger(JobPostMatchNotifyService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly profileRepo: Repository<JobSeekerProfile>,
    private readonly jobVettingService: JobVettingService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /** Loads job, scores candidates, sends job-match-recommendation emails (best-effort per recipient). */
  async processPublishedJobMatches(jobId: string): Promise<{
    jobId: string;
    candidatesConsidered: number;
    emailsSent: number;
    skippedReason?: string;
  }> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['skills', 'employer'],
    });

    if (!job) {
      this.logger.warn(`Job ${jobId} not found; skip match notifications`);
      return {
        jobId,
        candidatesConsidered: 0,
        emailsSent: 0,
        skippedReason: 'job_not_found',
      };
    }

    if (!isJobOpenOnMarketplace(job.status)) {
      this.logger.debug(
        `Job ${jobId} is not live on marketplace; skip notifications`,
      );
      return {
        jobId,
        candidatesConsidered: 0,
        emailsSent: 0,
        skippedReason: 'not_published',
      };
    }

    const now = new Date();
    if (job.applicationDeadline && new Date(job.applicationDeadline) <= now) {
      return {
        jobId,
        candidatesConsidered: 0,
        emailsSent: 0,
        skippedReason: 'deadline_passed',
      };
    }

    const candidateIds = await this.findCandidateProfileIds(job);
    if (candidateIds.length === 0) {
      this.logger.log(`No prefiltered candidates for job ${jobId}`);
      return { jobId, candidatesConsidered: 0, emailsSent: 0 };
    }

    const profiles = await this.profileRepo.find({
      where: { id: In(candidateIds) },
      relations: ['userSkills', 'userSkills.skill'],
    });

    const scored: ScoredProfile[] = [];
    for (const profile of profiles) {
      const completeness =
        this.jobVettingService.calculateProfileCompleteness(profile);
      if (completeness < JOB_POST_MATCH_CONFIG.MIN_PROFILE_COMPLETENESS) {
        continue;
      }

      const baseScore = this.jobVettingService.computeMatchScoreForPublishedJob(
        job,
        profile,
      );
      if (baseScore < JOB_POST_MATCH_CONFIG.MIN_BASE_SCORE) {
        continue;
      }

      const textSignal = computeTextMatchScore(job, profile);
      const textPoints =
        (textSignal / 100) * JOB_POST_MATCH_CONFIG.MAX_TEXT_SCORE_POINTS;
      const combinedScore = Math.min(100, baseScore + textPoints);

      scored.push({ profile, combinedScore });
    }

    scored.sort((a, b) => b.combinedScore - a.combinedScore);
    const top = scored.slice(0, JOB_POST_MATCH_CONFIG.MAX_EMAILS_PER_JOB);

    const websiteUrl = this.configService.get<string>(ENV.WEBSITE_URL) ?? '';
    const supportEmail =
      this.configService.get<string>(ENV.SUPPORT_EMAIL) ??
      'support@jobstack.org';
    const jobDetailUrl = websiteUrl
      ? `${websiteUrl.replace(/\/$/, '')}/jobseeker/dashboard/explore-jobs/${job.id}`
      : '';
    if (!jobDetailUrl) {
      this.logger.warn(
        `WEBSITE_URL is not set; skipping job match emails for job ${jobId}`,
      );
      return {
        jobId,
        candidatesConsidered: profiles.length,
        emailsSent: 0,
        skippedReason: 'missing_website_url',
      };
    }

    const employer = job.employer;
    const companyName = employer
      ? `${employer.firstName ?? ''} ${employer.lastName ?? ''}`.trim() ||
        'Employer'
      : 'Employer';
    const location = [job.city, job.state].filter(Boolean).join(', ');
    const description = job.description
      ? job.description.length > 400
        ? `${job.description.slice(0, 397)}…`
        : job.description
      : '';

    let emailsSent = 0;
    for (const { profile } of top) {
      if (!profile.email?.trim()) continue;
      try {
        await this.notificationService.sendEmail({
          to: profile.email,
          subject: `New role: ${job.title}`,
          template: EmailTemplateType.JOB_MATCH_RECOMMENDATION,
          context: {
            recipientName: `${profile.firstName} ${profile.lastName}`.trim(),
            firstName: profile.firstName,
            jobTitle: job.title,
            companyName,
            location: location || undefined,
            jobType: job.employmentType,
            workMode: job.workMode,
            salary: job.salary != null ? String(job.salary) : undefined,
            description,
            jobDetailUrl,
            subject: `New role: ${job.title}`,
          },
        });
        emailsSent++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to queue match email for ${profile.id}: ${errorMessage}`,
        );
      }
    }

    this.logger.log(
      `Job ${jobId} match notify: considered ${profiles.length}, sent ${emailsSent} emails`,
    );

    return {
      jobId,
      candidatesConsidered: profiles.length,
      emailsSent,
    };
  }

  /** Prefilter: approved profiles with skill overlap or category-aligned skills, excluding existing applicants. */
  private async findCandidateProfileIds(job: Job): Promise<string[]> {
    const qb = this.profileRepo
      .createQueryBuilder('p')
      .select('p.id')
      .where('p.approvalStatus = :approved', {
        approved: ApprovalStatus.APPROVED,
      })
      .andWhere('p.email IS NOT NULL')
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM job_applications ja
          WHERE ja."jobId" = :jobId AND ja."jobseekerProfileId" = p.id
        )`,
        { jobId: job.id },
      )
      .distinct(true)
      .orderBy('p.updatedAt', 'DESC')
      .take(JOB_POST_MATCH_CONFIG.MAX_CANDIDATES_TO_SCORE);

    if (job.skills?.length) {
      const skillIds = job.skills.map((s) => s.id);
      qb.innerJoin('p.userSkills', 'us').andWhere(
        'us.skillId IN (:...skillIds)',
        { skillIds },
      );
    } else {
      qb.innerJoin('p.userSkills', 'us')
        .innerJoin('us.skill', 'sk')
        .andWhere('sk.category = :category', { category: job.category });
    }

    const partial = await qb.getMany();
    return partial.map((row) => row.id);
  }
}
