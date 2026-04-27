import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource, In } from 'typeorm';
import {
  Employee,
  JobApplication,
  JobSeekerProfile,
} from '@app/common/database/entities';
import {
  EmployeeStatus,
  JobApplicationStatus,
  ProbationStatus,
  NotificationPriority,
} from '@app/common/database/entities/schema.enum';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { ProbationTrackingProducer } from '../queue';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { buildProbationSchedule } from '../utils/probation-policy.util';

type CurrentEmployeeResponse = {
  employeeId: string;
  jobId: string;
  candidateFullName: string;
  candidateEmail: string;
  candidatePhoneNumber?: string;
  employerName: string;
  employerEmail: string;
  jobTitle: string;
  startDate?: Date | null;
  probationStatus?: ProbationStatus | null;
  probationEndDate?: Date | null;
};

export type ReplacementCandidateOption = {
  jobseekerProfileId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isJobVetted: boolean;
  jobVettingScore?: number | null;
};

export type ReplacementCandidatesResponse = {
  jobVetted: ReplacementCandidateOption[];
  otherVetted: ReplacementCandidateOption[];
};

type ReplaceCandidateBody = {
  newJobseekerProfileId: string;
};

/**
 * Admin-only flow to swap the active employee on a job.
 * Keeps it minimal: swap the active `Employee` assignment + reset probation + send emails.
 */
@Injectable()
export class AdminReplacementService {
  private readonly logger = new Logger(AdminReplacementService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerRepo: Repository<JobSeekerProfile>,
    private readonly notificationService: NotificationService,
    private readonly probationTrackingProducer: ProbationTrackingProducer,
  ) {}

  private formatFullName(profile?: {
    firstName?: string;
    lastName?: string;
  }): string {
    const first = profile?.firstName ?? '';
    const last = profile?.lastName ?? '';
    return `${first} ${last}`.trim();
  }

  async getCurrentEmployee(jobId: string): Promise<CurrentEmployeeResponse> {
    const employee = await this.employeeRepo.findOne({
      where: { jobId, status: EmployeeStatus.ACTIVE },
      relations: ['job', 'employer', 'jobseekerProfile'],
    });

    if (!employee?.jobseekerProfile || !employee.employer || !employee.job) {
      throw new NotFoundException('No active employee found for this job');
    }

    const candidateFullName = this.formatFullName(employee.jobseekerProfile);
    const employerName = this.formatFullName(employee.employer);

    return {
      employeeId: employee.id,
      jobId,
      candidateFullName,
      candidateEmail: employee.jobseekerProfile.email,
      candidatePhoneNumber: employee.jobseekerProfile.phoneNumber,
      employerName,
      employerEmail: employee.employer.email,
      jobTitle: employee.job.title,
      startDate: employee.startDate ?? null,
      probationStatus: employee.probationStatus ?? null,
      probationEndDate: employee.probationEndDate ?? null,
    };
  }

  async getReplacementCandidates(params: {
    jobId: string;
    search?: string;
    limit?: number;
  }): Promise<ReplacementCandidatesResponse> {
    const { jobId, search, limit = 20 } = params;

    const currentEmployee = await this.employeeRepo.findOne({
      where: { jobId, status: EmployeeStatus.ACTIVE },
      relations: ['jobseekerProfile'],
    });
    const oldJobseekerProfileId = currentEmployee?.jobseekerProfileId;

    // Fetch job apps for this job (we'll group + rank in-memory for simplicity).
    const qb = this.applicationRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.jobseekerProfile', 'jobseekerProfile')
      .where('app.jobId = :jobId', { jobId })
      .orderBy('app.createdAt', 'DESC')
      .take(200);

    if (search?.trim()) {
      const s = `%${search.trim()}%`;
      qb.andWhere(
        '(jobseekerProfile.firstName ILIKE :s OR jobseekerProfile.lastName ILIKE :s OR jobseekerProfile.email ILIKE :s OR jobseekerProfile.phoneNumber ILIKE :s)',
        { s },
      );
    }

    const apps = await qb.getMany();

    const candidateIds = Array.from(
      new Set(
        apps
          .map((a) => a.jobseekerProfileId)
          .filter((id) => id && id !== oldJobseekerProfileId),
      ),
    );

    if (candidateIds.length === 0) {
      return { jobVetted: [], otherVetted: [] };
    }

    // Job-vetted: vetted within this job (score + vettedAt).
    // Platform-vetted: vetted anywhere on the platform (max score across any job).
    const platformVettedRows = await this.applicationRepo
      .createQueryBuilder('app')
      .select('app.jobseekerProfileId', 'jobseekerProfileId')
      .addSelect('MAX(app.vettingScore)', 'maxScore')
      .where('app.jobseekerProfileId IN (:...candidateIds)', { candidateIds })
      .andWhere('app.vettingScore IS NOT NULL')
      .andWhere('app.vettedAt IS NOT NULL')
      .groupBy('app.jobseekerProfileId')
      .getRawMany<{ jobseekerProfileId: string; maxScore: string | null }>();

    const platformVettedScore = new Map<string, number>(
      platformVettedRows.map((r) => [
        r.jobseekerProfileId,
        r.maxScore != null ? Number(r.maxScore) : 0,
      ]),
    );

    // Exclude already-employed candidates from swap options.
    const employedRows = await this.employeeRepo.find({
      where: {
        jobseekerProfileId: In(candidateIds),
        status: EmployeeStatus.ACTIVE,
      },
      select: ['jobseekerProfileId'],
    });
    const employedIds = new Set(employedRows.map((e) => e.jobseekerProfileId));

    const jobVettedOptions: ReplacementCandidateOption[] = [];
    const otherVettedOptions: ReplacementCandidateOption[] = [];

    for (const app of apps) {
      if (app.jobseekerProfileId === oldJobseekerProfileId) continue;
      if (employedIds.has(app.jobseekerProfileId)) continue;

      const jobVetted = app.vettingScore != null && app.vettedAt != null;

      const platformVetted = platformVettedScore.has(app.jobseekerProfileId);

      const profile = app.jobseekerProfile;
      if (!profile) continue;

      const option: ReplacementCandidateOption = {
        jobseekerProfileId: app.jobseekerProfileId,
        fullName: this.formatFullName(profile),
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        isJobVetted: jobVetted,
        jobVettingScore: app.vettingScore ?? null,
      };

      if (jobVetted) jobVettedOptions.push(option);
      else if (platformVetted) otherVettedOptions.push(option);
    }

    jobVettedOptions.sort(
      (a, b) => (b.jobVettingScore ?? 0) - (a.jobVettingScore ?? 0),
    );
    otherVettedOptions.sort(
      (a, b) =>
        (platformVettedScore.get(b.jobseekerProfileId) ?? 0) -
        (platformVettedScore.get(a.jobseekerProfileId) ?? 0),
    );

    return {
      jobVetted: jobVettedOptions.slice(0, limit),
      otherVetted: otherVettedOptions.slice(0, limit),
    };
  }

  async replaceCandidate(jobId: string, body: ReplaceCandidateBody) {
    const now = new Date();

    // Load once for validation outside transaction for clearer errors.
    const currentEmployee = await this.employeeRepo.findOne({
      where: { jobId, status: EmployeeStatus.ACTIVE },
      relations: ['job', 'employer', 'jobseekerProfile'],
    });

    if (
      !currentEmployee?.jobseekerProfile ||
      !currentEmployee.employer ||
      !currentEmployee.job
    ) {
      throw new NotFoundException('No active employee found for this job');
    }

    const oldJobseekerProfileId = currentEmployee.jobseekerProfileId;
    const newJobseekerProfileId = body.newJobseekerProfileId;

    if (newJobseekerProfileId === oldJobseekerProfileId) {
      throw new BadRequestException('You must select a different candidate');
    }

    // Ensure new candidate is available (not already employed elsewhere).
    const alreadyEmployed = await this.employeeRepo.findOne({
      where: {
        jobseekerProfileId: newJobseekerProfileId,
        status: EmployeeStatus.ACTIVE,
      },
    });
    if (alreadyEmployed) {
      throw new BadRequestException(
        'Selected candidate is already active on another job',
      );
    }

    const newCandidateProfile = await this.jobseekerRepo.findOne({
      where: { id: newJobseekerProfileId },
    });
    if (!newCandidateProfile) {
      throw new NotFoundException('New candidate profile not found');
    }

    const job = currentEmployee.job;
    const employer = currentEmployee.employer;

    const txResult = await this.dataSource.transaction(async (manager) => {
      const employeeManager = manager.getRepository(Employee);
      const applicationManager = manager.getRepository(JobApplication);
      const jobseekerManager = manager.getRepository(JobSeekerProfile);

      const newCandidate = await jobseekerManager.findOne({
        where: { id: newJobseekerProfileId },
      });
      if (!newCandidate)
        throw new NotFoundException('New candidate profile not found');

      // Detach old job application (if it exists).
      const oldApp = await applicationManager.findOne({
        where: { jobId, jobseekerProfileId: oldJobseekerProfileId },
      });

      if (oldApp) {
        oldApp.status = JobApplicationStatus.WITHDRAWN;
        oldApp.statusUpdatedAt = now;
        await applicationManager.save(oldApp);
      }

      // Attach new job application as probation.
      const newApp = await applicationManager.findOne({
        where: { jobId, jobseekerProfileId: newJobseekerProfileId },
      });

      if (!newApp) {
        throw new NotFoundException(
          'New candidate does not have a job application for this job',
        );
      }

      // Employer wants the new candidate to work immediately.
      newApp.status = JobApplicationStatus.HIRED;
      newApp.statusUpdatedAt = now;
      await applicationManager.save(newApp);

      const probationSchedule = buildProbationSchedule({
        employmentArrangement: job.employmentArrangement,
        startDate: now,
        endDate: currentEmployee.endDate,
      });

      // Create fresh employee record for new candidate with probation fields.
      const newEmployee = employeeManager.create({
        employerId: employer.id,
        jobId,
        jobseekerProfileId: newJobseekerProfileId,
        employmentType: job.employmentType,
        employmentArrangement: job.employmentArrangement,
        status: EmployeeStatus.ACTIVE,
        startDate: now,
        endDate: currentEmployee.endDate,
        probationStatus: ProbationStatus.ACTIVE,
        probationEndDate: probationSchedule.probationEndDate,
        pulse30SentAt: null,
        pulse60SentAt: null,
        salaryOffered: currentEmployee.salaryOffered,
        contractFeeOffered: currentEmployee.contractFeeOffered,
        contractPaymentType: currentEmployee.contractPaymentType,
        currency: currentEmployee.currency,
        notes: currentEmployee.notes,
        paymentStatus: currentEmployee.paymentStatus,
        activationBlocked: false,
        piiUnlocked: true,
      });

      const savedNewEmployee = await employeeManager.save(newEmployee);

      // Terminate old employee so old jobseeker is available again.
      const oldEmployeeInTx = await employeeManager.findOne({
        where: { id: currentEmployee.id },
      });
      if (!oldEmployeeInTx)
        throw new NotFoundException('Old employee missing during swap');
      oldEmployeeInTx.status = EmployeeStatus.TERMINATED;
      oldEmployeeInTx.probationStatus = ProbationStatus.TERMINATED;
      await employeeManager.save(oldEmployeeInTx);

      // Emails sent outside transaction after we return.
      return {
        employeeId: savedNewEmployee.id,
        reminderAt: probationSchedule.reminderAt,
        confirmAt: probationSchedule.confirmAt,
      };
    });

    // Schedule probation reminder + confirmation for the new employee.
    await this.probationTrackingProducer.scheduleEmployeeProbationMilestones({
      employeeId: txResult.employeeId,
      reminderAt: txResult.reminderAt,
      confirmAt: txResult.confirmAt,
    });

    // Send notifications after DB swap.
    const current = await this.employeeRepo.findOne({
      where: { jobId, status: EmployeeStatus.ACTIVE },
      relations: ['job', 'employer', 'jobseekerProfile'],
    });

    if (!current?.jobseekerProfile || !current.employer || !current.job) {
      this.logger.error(
        `replaceCandidate: failed to load new active employee for job ${jobId}`,
      );
      return;
    }

    const employerFirstName = current.employer.firstName;
    const employerLastName = current.employer.lastName;
    const employerName = this.formatFullName(current.employer);

    const candidateFullName = this.formatFullName(current.jobseekerProfile);
    const candidateEmail = current.jobseekerProfile.email;
    const candidatePhoneNumber = current.jobseekerProfile.phoneNumber;

    await this.notificationService.sendEmail({
      to: employer.email,
      subject: `Replacement confirmed — ${candidateFullName} assigned to ${job.title}`,
      template: 'admin-replacement-to-employer',
      context: {
        employerFirstName,
        employerLastName,
        employerName,
        jobTitle: job.title,
        candidateFullName,
        candidateEmail,
        candidatePhoneNumber,
      },
    });

    await this.notificationService.sendEmail({
      to: candidateEmail,
      subject: `You have been assigned to ${job.title}`,
      template: 'admin-replacement-to-candidate',
      context: {
        firstName: current.jobseekerProfile.firstName,
        jobTitle: job.title,
        employerName,
        candidateFullName,
      },
    });

    // In-app notifications
    try {
      await this.notificationService.createAppNotification(
        employer.id,
        UserRole.EMPLOYER,
        {
          title: 'Candidate Replacement Confirmed',
          message: `${candidateFullName} has been assigned to "${job.title}". You can view their details in your dashboard.`,
          priority: NotificationPriority.HIGH,
          metadata: { jobId: job.id, employeeId: current.id },
        },
      );

      await this.notificationService.createAppNotification(
        current.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: 'Employment Confirmed',
          message: `You have been assigned to the role of "${job.title}". Check your dashboard for details.`,
          priority: NotificationPriority.HIGH,
          metadata: { jobId: job.id, employeeId: current.id },
        },
      );
    } catch (_) {
      /* non-blocking */
    }

    return { success: true };
  }
}
