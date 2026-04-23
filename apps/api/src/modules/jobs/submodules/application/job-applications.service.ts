import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import {
  Job,
  JobApplication,
  JobSeekerProfile,
  Employee,
} from '@app/common/database/entities';
import {
  ApplicationQueryDto,
  CreateJobApplicationDto,
  UpdateApplicationStatusDto,
} from './dto';
import {
  ApprovalStatus,
  JobApplicationStatus,
  JobStatus,
  EmployeeStatus,
  EmploymentArrangement,
  ProbationStatus,
  isJobOpenOnMarketplace,
} from '@app/common/database/entities/schema.enum';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { ProbationTrackingProducer } from '../../queue';
import { JobVettingProducer } from '../../queue/job-vetting.producer';
import { JobVettingMilestoneNotifyService } from '../../services/job-vetting-milestone-notify.service';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { NotificationPriority } from '@app/common/database/entities/schema.enum';
import { buildProbationSchedule } from '../../utils/probation-policy.util';

@Injectable()
export class JobApplicationsService {
  private readonly logger = new Logger(JobApplicationsService.name);
  constructor(
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerRepo: Repository<JobSeekerProfile>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly notificationService: NotificationService,
    private readonly probationTrackingProducer: ProbationTrackingProducer,
    private readonly jobVettingProducer: JobVettingProducer,
    private readonly jobVettingMilestoneNotifyService: JobVettingMilestoneNotifyService,
  ) {}

  private readonly relations = ['job', 'jobseekerProfile'];

  // Creates a new job application for a job seeker
  async applyToJob(
    jobId: string,
    jobseekerId: string,
    dto: CreateJobApplicationDto,
  ) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || !isJobOpenOnMarketplace(job.status)) {
      throw new BadRequestException('Job is not open for applications');
    }

    const profile = await this.jobseekerRepo.findOne({
      where: { id: jobseekerId },
    });
    if (!profile) {
      throw new NotFoundException('Jobseeker profile not found');
    }

    if (profile.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new ForbiddenException(
        'Your profile is not approved yet. You cannot apply for jobs at this time.',
      );
    }

    const exists = await this.applicationRepo.findOne({
      where: { jobId, jobseekerProfileId: jobseekerId },
    });
    if (exists) {
      throw new BadRequestException('Application already exists');
    }

    const application = this.applicationRepo.create({
      jobId,
      jobseekerProfileId: jobseekerId,
      note: dto.note,
      status: JobApplicationStatus.APPLIED,
    });

    const saved = await this.applicationRepo.save(application);

    // Queue auto-vetting once there is at least one applicant (not on job publish)
    try {
      await this.jobVettingProducer.queueJobVetting(jobId, 'application', {
        bullJobIdSuffix: saved.id,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to queue vetting after application for job ${jobId}: ${err.message}`,
      );
    }

    // Notify jobseeker that their application was received
    try {
      await this.notificationService.createAppNotification(
        jobseekerId,
        UserRole.JOB_SEEKER,
        {
          title: 'Application Submitted',
          message: `Your application for "${job.title}" has been submitted successfully. We'll keep you updated.`,
          priority: NotificationPriority.MEDIUM,
          metadata: { jobId: job.id, applicationId: saved.id },
        },
      );
    } catch (err) {
      this.logger.warn(
        `Failed to create app notification for jobseeker application: ${err.message}`,
      );
    }

    // Every 5th applicant: non-blocking email nudge to vetting admin (or super admin)
    void this.applicationRepo
      .count({ where: { jobId } })
      .then((applicantCount) =>
        this.jobVettingMilestoneNotifyService.notifyIfApplicantMilestone(
          jobId,
          job.title,
          applicantCount,
        ),
      )
      .catch((err) =>
        this.logger.warn(
          `Vetting milestone notification failed for job ${jobId}: ${err?.message ?? err}`,
        ),
      );

    return this.getApplicationById(saved.id);
  }

  // Fetches all applications made by a jobseeker
  async getJobseekerApplications(
    jobseekerId: string,
    query: ApplicationQueryDto,
  ) {
    const qb = this.baseApplicationQuery().where(
      'application.jobseekerProfileId = :jobseekerId',
      { jobseekerId },
    );
    this.applyApplicationFilters(qb, query);
    const result = await this.executePagedApplicationQuery(qb, query);

    // Annotate each application with its associated employeeId so the frontend
    // can fetch probation progress without an extra lookup.
    if (result.items.length > 0) {
      const employeeMap = await this.buildEmployeeIdMapForApplicationItems(
        result.items,
      );

      return {
        ...result,
        items: result.items.map((app) => ({
          ...app,
          employeeId:
            employeeMap.get(`${app.jobId}:${app.jobseekerProfileId}`) ?? null,
        })),
      };
    }

    return result;
  }

  // Lists applications for a specific job under an employer
  async getEmployerJobApplications(
    employerId: string,
    jobId: string,
    query: ApplicationQueryDto,
  ) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const qb = this.baseApplicationQuery().where('application.jobId = :jobId', {
      jobId,
    });
    this.applyApplicationFilters(qb, query);
    return this.executePagedApplicationQuery(qb, query);
  }

  // Lists all candidate-stage applications across employer jobs
  async getEmployerCandidates(employerId: string, query: ApplicationQueryDto) {
    // Candidate stages include screening and post-screening states
    const candidateStatuses: JobApplicationStatus[] = [
      JobApplicationStatus.SELECTED_FOR_SCREENING,
      JobApplicationStatus.SELECTED_FOR_HIRE,
      JobApplicationStatus.OFFER_SENT,
      JobApplicationStatus.APPLICANT_ACCEPTED,
      JobApplicationStatus.PAYMENT_COMPLETE,
      JobApplicationStatus.CONTRACT_SIGNED,
      JobApplicationStatus.HIRED,
    ];

    const qb = this.baseApplicationQuery().where(
      'job.employerId = :employerId',
      { employerId },
    );

    qb.andWhere('application.status IN (:...candidateStatuses)', {
      candidateStatuses,
    });

    this.applyApplicationFilters(qb, query);
    const result = await this.executePagedApplicationQuery(qb, query);

    // Annotate each application with its associated employeeId so the
    // frontend can use it directly for payment flows without an extra lookup.
    if (result.items.length > 0) {
      const employeeMap = await this.buildEmployeeIdMapForApplicationItems(
        result.items,
      );

      return {
        ...result,
        items: result.items.map((app) => ({
          ...app,
          employeeId:
            employeeMap.get(`${app.jobId}:${app.jobseekerProfileId}`) ?? null,
        })),
      };
    }

    return result;
  }

  // Updates application status for employer-owned job
  async updateApplicationStatus(
    employerId: string,
    applicationId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });
    if (!application || application.job?.employerId !== employerId) {
      throw new NotFoundException('Application not found');
    }

    application.status = dto.status;
    application.note = dto.note ?? application.note;
    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);
    return this.getApplicationById(applicationId);
  }

  // Lists applications for admins
  async getAdminApplications(query: ApplicationQueryDto) {
    const qb = this.baseApplicationQuery();
    this.applyApplicationFilters(qb, query);
    return this.executePagedApplicationQuery(qb, query);
  }

  // Retrieves a single application for the current jobseeker.
  async getJobseekerApplicationById(
    jobseekerId: string,
    applicationId: string,
  ) {
    const application = await this.getApplicationById(applicationId);
    if (application.jobseekerProfileId !== jobseekerId) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  // Retrieves single application for admin or internal use
  async getApplicationById(applicationId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: [...this.relations, 'job.employer'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const employee = await this.employeeRepo.findOne({
      where: {
        jobId: application.jobId,
        jobseekerProfileId: application.jobseekerProfileId,
      },
      order: { updatedAt: 'DESC' },
      select: [
        'id',
        'status',
        'probationStatus',
        'probationEndDate',
        'startDate',
        'endDate',
        'pulse30SentAt',
        'employerDeclaredCompleteAt',
        'jobseekerDeclaredCompleteAt',
      ],
    });

    return {
      ...application,
      employeeId: employee?.id ?? null,
      employee: employee
        ? {
            id: employee.id,
            status: employee.status,
            probationStatus: employee.probationStatus ?? null,
            probationEndDate: employee.probationEndDate ?? null,
            startDate: employee.startDate ?? null,
            endDate: employee.endDate ?? null,
            reminderSentAt: employee.pulse30SentAt ?? null,
            employerDeclaredCompleteAt:
              employee.employerDeclaredCompleteAt ?? null,
            jobseekerDeclaredCompleteAt:
              employee.jobseekerDeclaredCompleteAt ?? null,
          }
        : null,
    };
  }

  // Base query for applications with joined relations
  private baseApplicationQuery(): SelectQueryBuilder<JobApplication> {
    return this.applicationRepo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.jobseekerProfile', 'jobseeker');
  }

  // Applies status filters to application queries
  private applyApplicationFilters(
    qb: SelectQueryBuilder<JobApplication>,
    query: ApplicationQueryDto,
  ) {
    if (query.status) {
      qb.andWhere('application.status = :status', { status: query.status });
    }
  }

  // Executes paginated application queries
  private async executePagedApplicationQuery(
    qb: SelectQueryBuilder<JobApplication>,
    query: ApplicationQueryDto,
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    qb.take(limit)
      .skip((page - 1) * limit)
      .orderBy('application.createdAt', 'DESC');
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  // Latest employee id per (job, jobseeker) pair for list views (includes ended rows).
  private async buildEmployeeIdMapForApplicationItems(
    items: Pick<JobApplication, 'jobId' | 'jobseekerProfileId'>[],
  ): Promise<Map<string, string>> {
    if (items.length === 0) {
      return new Map();
    }
    const qb = this.employeeRepo.createQueryBuilder('e');
    items.forEach((app, i) => {
      qb.orWhere(`(e.jobId = :jid${i} AND e.jobseekerProfileId = :pid${i})`, {
        [`jid${i}`]: app.jobId,
        [`pid${i}`]: app.jobseekerProfileId,
      });
    });
    const rows = await qb.getMany();
    rows.sort(
      (a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
    );
    const map = new Map<string, string>();
    for (const e of rows) {
      const key = `${e.jobId}:${e.jobseekerProfileId}`;
      if (!map.has(key)) {
        map.set(key, e.id);
      }
    }
    return map;
  }

  // Applicant accepts the offer from employer
  async applicantAcceptOffer(
    jobseekerId: string,
    applicationId: string,
    acceptance: {
      accepted: boolean;
      note?: string;
    },
  ) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, jobseekerProfileId: jobseekerId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== JobApplicationStatus.OFFER_SENT) {
      throw new BadRequestException(
        'Can only accept/reject offers after employer has accepted you',
      );
    }

    // Enforce offer expiry window using statusUpdatedAt as employerAcceptedAt
    const employerAcceptedAt = application.statusUpdatedAt;
    if (employerAcceptedAt && acceptance.accepted) {
      const offerExpiresAt = new Date(
        employerAcceptedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
      if (new Date() > offerExpiresAt) {
        throw new BadRequestException('Offer has expired');
      }
    }

    if (acceptance.accepted) {
      // Applicant accepts - move to APPLICANT_ACCEPTED
      application.status = JobApplicationStatus.APPLICANT_ACCEPTED;
      if (acceptance.note) {
        application.note = acceptance.note;
      }
    } else {
      // Applicant rejects - move to WITHDRAWN
      application.status = JobApplicationStatus.WITHDRAWN;
      application.note = acceptance.note || 'Candidate declined the offer';
    }

    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    // Notify employer of candidate's decision
    try {
      const employerId = application.job.employerId;
      if (acceptance.accepted) {
        await this.notificationService.createAppNotification(
          employerId,
          UserRole.EMPLOYER,
          {
            title: '✅ Candidate Accepted Your Offer',
            message: `A candidate has accepted your offer for "${application.job.title}". Proceed with payment to unlock their contact details.`,
            priority: NotificationPriority.HIGH,
            metadata: { jobId: application.jobId, applicationId },
          },
        );
      } else {
        await this.notificationService.createAppNotification(
          employerId,
          UserRole.EMPLOYER,
          {
            title: 'Candidate Declined Offer',
            message: `A candidate has declined your offer for "${application.job.title}".`,
            priority: NotificationPriority.MEDIUM,
            metadata: { jobId: application.jobId, applicationId },
          },
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to notify employer of candidate decision: ${err.message}`,
      );
    }

    return this.getApplicationById(applicationId);
  }

  // Employer sends a reminder email for a pending offer
  async sendOfferReminder(employerId: string, applicationId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job', 'job.employer', 'jobseekerProfile'],
    });

    if (!application || application.job?.employerId !== employerId) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== JobApplicationStatus.OFFER_SENT) {
      throw new BadRequestException(
        'Can only send reminders for pending offers awaiting candidate decision',
      );
    }

    // Compute offer expiry window for informational purposes
    const employerAcceptedAt = application.statusUpdatedAt;
    let offerExpiresAt: Date | null = null;
    if (employerAcceptedAt) {
      offerExpiresAt = new Date(
        employerAcceptedAt.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
    }

    // Notify candidate via email + in-app
    try {
      if (application.jobseekerProfile?.email) {
        const websiteUrl = process.env.WEBSITE_URL ?? '';
        const applicationsUrl = websiteUrl
          ? `${websiteUrl}/jobseeker/dashboard/applications`
          : undefined;

        await this.notificationService.sendEmail({
          to: application.jobseekerProfile.email,
          subject: `Reminder: Job offer for ${application.job.title}`,
          template: 'general-notification',
          context: {
            title: 'Reminder: Job Offer Pending',
            message: `The employer for "${application.job.title}" is waiting for your response to their offer.`,
            jobTitle: application.job.title,
            jobId: application.job.id,
            applicationId: application.id,
            offerExpiresAt: offerExpiresAt?.toISOString() ?? null,
            actionUrl: applicationsUrl ?? null,
            actionText: 'View application',
          },
        });
      }

      // In-app notification for the reminder
      await this.notificationService.createAppNotification(
        application.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: '⏰ Reminder: Pending Job Offer',
          message: `The employer for "${application.job.title}" is still waiting for your response. Don't let the offer expire!`,
          priority: NotificationPriority.HIGH,
          metadata: { jobId: application.jobId, applicationId },
        },
      );
    } catch (error) {
      // Notification failures should not block the core flow
    }

    return this.getApplicationById(applicationId);
  }

  // Employer confirms final hire after contract is signed
  async confirmHire(employerId: string, applicationId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.job.employerId !== employerId) {
      throw new BadRequestException(
        'You do not have access to this application',
      );
    }

    if (application.status !== JobApplicationStatus.CONTRACT_SIGNED) {
      throw new BadRequestException(
        'Application must be in CONTRACT_SIGNED status to confirm hire',
      );
    }

    // Employer confirmation means the candidate resumes work immediately.
    application.status = JobApplicationStatus.HIRED;
    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    const employee = await this.employeeRepo.findOne({
      where: {
        jobId: application.jobId,
        jobseekerProfileId: application.jobseekerProfileId,
        employerId,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee record not found for application');
    }

    if (!employee.startDate) {
      throw new BadRequestException(
        'Employee startDate is missing; cannot start probation',
      );
    }

    if (
      employee.employmentArrangement === EmploymentArrangement.CONTRACT &&
      !employee.endDate
    ) {
      throw new BadRequestException(
        'Contract endDate is required before confirming hire',
      );
    }

    const probationSchedule = buildProbationSchedule({
      employmentArrangement: employee.employmentArrangement,
      startDate: employee.startDate,
      endDate: employee.endDate,
    });

    // Activate employee and initialize adaptive probation tracking.
    employee.status = EmployeeStatus.ACTIVE;
    employee.probationStatus = ProbationStatus.ACTIVE;
    employee.probationEndDate = probationSchedule.probationEndDate;
    employee.pulse30SentAt = null;
    employee.pulse60SentAt = null;
    await this.employeeRepo.save(employee);

    await this.probationTrackingProducer.scheduleEmployeeProbationMilestones({
      employeeId: employee.id,
      reminderAt: probationSchedule.reminderAt,
      confirmAt: probationSchedule.confirmAt,
    });

    // Notify jobseeker they are hired
    try {
      await this.notificationService.createAppNotification(
        application.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: '🎊 You have been Hired!',
          message: `Congratulations! Your employment for "${application.job.title}" has been confirmed. Your probation period starts now.`,
          priority: NotificationPriority.HIGH,
          metadata: {
            jobId: application.jobId,
            applicationId,
            employeeId: employee.id,
          },
        },
      );
    } catch (err) {
      this.logger.warn(`Failed to notify jobseeker of hire: ${err.message}`);
    }

    return this.getApplicationById(applicationId);
  }

  // Allows jobseeker to withdraw their application
  async withdrawApplication(jobseekerId: string, applicationId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, jobseekerProfileId: jobseekerId },
      relations: ['job'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Don't allow withdrawal of already terminal states
    if (
      [
        JobApplicationStatus.PAYMENT_COMPLETE,
        JobApplicationStatus.CONTRACT_SIGNED,
        JobApplicationStatus.HIRED,
        JobApplicationStatus.REJECTED,
        JobApplicationStatus.WITHDRAWN,
      ].includes(application.status)
    ) {
      throw new BadRequestException(
        'Cannot withdraw an application in its current status',
      );
    }

    application.status = JobApplicationStatus.WITHDRAWN;
    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    return this.getApplicationById(applicationId);
  }
}
