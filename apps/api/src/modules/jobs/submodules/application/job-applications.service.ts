import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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
  JobApplicationStatus,
  JobStatus,
  EmployeeStatus,
  EmploymentArrangement,
  ProbationStatus,
} from '@app/common/database/entities/schema.enum';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { ProbationTrackingProducer } from '../../queue';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { NotificationPriority } from '@app/common/database/entities/schema.enum';

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
  ) {}

  private readonly relations = ['job', 'jobseekerProfile'];

  // Creates a new job application for a job seeker
  async applyToJob(
    jobId: string,
    jobseekerId: string,
    dto: CreateJobApplicationDto,
  ) {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.status !== JobStatus.PUBLISHED) {
      throw new BadRequestException('Job is not open for applications');
    }

    const profile = await this.jobseekerRepo.findOne({
      where: { id: jobseekerId },
    });
    if (!profile) {
      throw new NotFoundException('Jobseeker profile not found');
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
      expectedSalary: dto.expectedSalary,
      note: dto.note,
      status: JobApplicationStatus.APPLIED,
    });

    const saved = await this.applicationRepo.save(application);

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
      this.logger.warn(`Failed to create app notification for jobseeker application: ${err.message}`);
    }

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
      const employees = await this.employeeRepo.find({
        where: result.items.map((app) => ({
          jobId: app.jobId,
          jobseekerProfileId: app.jobseekerProfileId,
          status: EmployeeStatus.ACTIVE,
        })),
        select: ['id', 'jobId', 'jobseekerProfileId'],
      });

      const employeeMap = new Map(
        employees.map((e) => [`${e.jobId}:${e.jobseekerProfileId}`, e.id]),
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
      JobApplicationStatus.SCREENING_COMPLETED,
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
      const employees = await this.employeeRepo.find({
        where: result.items.map((app) => ({
          jobId: app.jobId,
          jobseekerProfileId: app.jobseekerProfileId,
        })),
        select: ['id', 'jobId', 'jobseekerProfileId'],
      });

      const employeeMap = new Map(
        employees.map((e) => [`${e.jobId}:${e.jobseekerProfileId}`, e.id]),
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

  // Retrieves single application for admin or internal use
  async getApplicationById(applicationId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: [...this.relations, 'job.employer'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  // Base query for applications with joined relations
  private baseApplicationQuery(): SelectQueryBuilder<JobApplication> {
    return this.applicationRepo
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('application.jobseekerProfile', 'jobseeker');
  }

  // Determines if a screening window has completed based on scheduled time and duration
  private isScreeningCompleted(application: JobApplication): boolean {
    const { screeningScheduledAt, screeningDurationMinutes } = application;

    if (!screeningScheduledAt || screeningDurationMinutes == null) {
      return false;
    }

    const startMs = screeningScheduledAt.getTime();
    const endMs = startMs + screeningDurationMinutes * 60 * 1000;
    return Date.now() >= endMs;
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

  // Employer accepts candidate after screening - creates Employee record
  async employerAcceptCandidate(
    employerId: string,
    applicationId: string,
    offerDetails: {
      startDate?: Date;
      notes?: string;
    },
  ) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job', 'jobseekerProfile'],
    });

    if (!application || application.job?.employerId !== employerId) {
      throw new NotFoundException('Application not found');
    }

    // Only allow acceptance after the screening window has elapsed
    if (!this.isScreeningCompleted(application)) {
      throw new BadRequestException(
        'Can only accept candidates after the scheduled screening time has completed',
      );
    }

    // Check if Employee record already exists for this application
    const existingEmployee = await this.employeeRepo.findOne({
      where: {
        jobId: application.jobId,
        jobseekerProfileId: application.jobseekerProfileId,
      },
    });

    if (existingEmployee) {
      throw new BadRequestException(
        'Employee record already exists for this candidate',
      );
    }

    // Validate that job has salary or contractFee defined
    if (
      application.job.employmentArrangement ===
        EmploymentArrangement.PERMANENT_EMPLOYEE &&
      !application.job.salary
    ) {
      throw new BadRequestException(
        'Job does not have salary defined. Please update the job posting first.',
      );
    }

    if (
      application.job.employmentArrangement ===
        EmploymentArrangement.CONTRACT &&
      !application.job.contractFee
    ) {
      throw new BadRequestException(
        'Job does not have contract fee defined. Please update the job posting first.',
      );
    }

    // Create Employee record with piiUnlocked = false (gated)
    // Salary/contractFee comes from the Job, not from the offer details
    const employee = this.employeeRepo.create({
      employerId,
      jobId: application.jobId,
      jobseekerProfileId: application.jobseekerProfileId,
      employmentType: application.job.employmentType,
      employmentArrangement: application.job.employmentArrangement,
      status: EmployeeStatus.ONBOARDING,
      salaryOffered:
        application.job.employmentArrangement ===
        EmploymentArrangement.PERMANENT_EMPLOYEE
          ? application.job.salary
          : undefined,
      contractFeeOffered:
        application.job.employmentArrangement === EmploymentArrangement.CONTRACT
          ? application.job.contractFee
          : undefined,
      contractPaymentType:
        application.job.employmentArrangement === EmploymentArrangement.CONTRACT
          ? application.job.contractPaymentType
          : undefined,
      currency: 'NGN', // Default currency
      startDate: offerDetails.startDate,
      notes: offerDetails.notes,
      piiUnlocked: false, // Gated until payment
    });

    const savedEmployee = await this.employeeRepo.save(employee);

    // Update application status to EMPLOYER_ACCEPTED
    application.status = JobApplicationStatus.OFFER_SENT;
    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    // Notify jobseeker about the offer
    try {
      await this.notificationService.createAppNotification(
        application.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: '🎉 Job Offer Received!',
          message: `You have received a job offer for "${application.job.title}". Please review and respond within 7 days.`,
          priority: NotificationPriority.HIGH,
          metadata: { jobId: application.jobId, applicationId },
        },
      );
    } catch (err) {
      this.logger.warn(`Failed to notify jobseeker of offer: ${err.message}`);
    }

    return {
      application: await this.getApplicationById(applicationId),
      employee: savedEmployee,
    };
  }

  // Handles employer response to screening schedule (accept or propose new time)
  async employerRespondToScreeningSchedule(
    employerId: string,
    applicationId: string,
    response: {
      accepted: boolean;
      proposedTime?: Date;
    },
  ) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job'],
    });

    if (!application || application.job?.employerId !== employerId) {
      throw new NotFoundException('Application not found');
    }

    // Only allow responses for applications that have been selected for screening
    if (
      application.status !== JobApplicationStatus.SELECTED_FOR_SCREENING ||
      !application.screeningScheduledAt
    ) {
      throw new BadRequestException(
        'Screening must be scheduled before employer can respond',
      );
    }

    // Custom screening must be enabled for collaborative scheduling
    if (!application.job.performCustomScreening) {
      throw new BadRequestException(
        'Employer responses are only allowed for custom screening jobs',
      );
    }

    // Record employer decision and optional proposed time
    if (response.accepted) {
      application.employerAccepted = true;

      if (response.proposedTime) {
        application.employerProposedScreeningTime = response.proposedTime;
        application.adminAccepted = false;
      }
    } else {
      application.employerAccepted = false;
    }

    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    // Notify JobStack admin when employer responds (accepts or proposes)
    try {
      const adminEmail =
        process.env.ADMIN_EMAIL || application.job.employer.email;
      const isProposal = !!response.proposedTime;

      await this.notificationService.sendEmail({
        to: adminEmail,
        subject: isProposal
          ? `Employer proposed new screening time for ${application.job.title}`
          : `Employer responded to screening schedule for ${application.job.title}`,
        template: 'general-notification',
        context: {
          title: isProposal
            ? 'Employer Proposed New Screening Time'
            : 'Employer Responded to Screening Schedule',
          message: isProposal
            ? `The employer has proposed a new screening time for job "${application.job.title}".`
            : `The employer has ${
                response.accepted ? 'accepted' : 'declined'
              } the current screening time for job "${application.job.title}".`,
          jobTitle: application.job.title,
          jobId: application.job.id,
          applicationId: application.id,
          proposedTime: response.proposedTime?.toISOString() ?? null,
        },
      });
    } catch (error) {
      // Notification failures should not block the core flow
    }

    return this.getApplicationById(applicationId);
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
      this.logger.warn(`Failed to notify employer of candidate decision: ${err.message}`);
    }

    return this.getApplicationById(applicationId);
  }

  // Admin accepts employer's proposed screening time and updates the schedule
  async adminAcceptEmployerScreeningProposal(applicationId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: ['job', 'job.employer', 'jobseekerProfile'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (!application.job.performCustomScreening) {
      throw new BadRequestException(
        'Admin can only accept employer proposals for custom screening jobs',
      );
    }

    if (!application.employerProposedScreeningTime) {
      throw new BadRequestException(
        'No employer proposed screening time to accept',
      );
    }

    // Apply employer-proposed time as the new official schedule
    application.screeningScheduledAt =
      application.employerProposedScreeningTime;
    application.adminProposedScreeningTime =
      application.employerProposedScreeningTime;
    application.adminAccepted = true;

    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    // Notify employer that admin has accepted their proposed time
    try {
      if (application.job.employer?.email) {
        await this.notificationService.sendEmail({
          to: application.job.employer.email,
          subject: `Admin accepted your proposed screening time for ${application.job.title}`,
          template: 'employer-screening-invitation',
          context: {
            employerName: `${application.job.employer.firstName} ${application.job.employer.lastName}`,
            jobTitle: application.job.title,
            jobId: application.job.id,
            candidateName: `${application.jobseekerProfile.firstName} ${application.jobseekerProfile.lastName}`,
            applicationId: application.id,
            meetingLink: application.screeningMeetingLink,
            scheduledDate: application.screeningScheduledAt.toDateString(),
            scheduledTime: application.screeningScheduledAt.toTimeString(),
            scheduledDateTime: application.screeningScheduledAt.toISOString(),
            prepInfo: application.screeningPrepInfo || null,
          },
        });
      }

      await this.notificationService.createAppNotification(
        application.job.employerId,
        UserRole.EMPLOYER,
        {
          title: '🗓️ Screening Proposal Accepted',
          message: `Your proposed screening time for candidate ${application.jobseekerProfile.firstName} (${application.job.title}) has been approved.`,
          priority: NotificationPriority.MEDIUM,
          metadata: { jobId: application.job.id, applicationId },
        },
      );
    } catch (error) {
      // Notification failures should not block the core flow
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
      throw new BadRequestException('You do not have access to this application');
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

    // Activate employee + start probation tracking immediately after contract confirmation.
    employee.status = EmployeeStatus.ACTIVE;
    employee.probationStatus = ProbationStatus.ACTIVE;
    employee.probationEndDate = new Date(
      employee.startDate.getTime() + 90 * 24 * 60 * 60 * 1000,
    );
    employee.pulse30SentAt = null;
    employee.pulse60SentAt = null;
    await this.employeeRepo.save(employee);

    await this.probationTrackingProducer.scheduleEmployeeProbationMilestones(
      {
        employeeId: employee.id,
        startDate: employee.startDate,
      },
    );

    // Notify jobseeker they are hired
    try {
      await this.notificationService.createAppNotification(
        application.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: '🎊 You have been Hired!',
          message: `Congratulations! Your employment for "${application.job.title}" has been confirmed. Your probation period starts now.`,
          priority: NotificationPriority.HIGH,
          metadata: { jobId: application.jobId, applicationId, employeeId: employee.id },
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
