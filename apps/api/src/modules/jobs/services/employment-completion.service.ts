import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Employee,
  EmployerProfile,
  JobApplication,
} from '@app/common/database/entities';
import {
  EmployeeStatus,
  isEmployeeOpenForMutualCompletion,
  NotificationPriority,
  ProbationStatus,
} from '@app/common/database/entities/schema.enum';
import { ENV } from '../../config/env.config';
import { NotificationService } from '../../notification/notification.service';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

@Injectable()
export class EmploymentCompletionService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepo: Repository<EmployerProfile>,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  // Builds absolute frontend URL without trailing slash duplication.
  private frontendBase(): string {
    return (
      this.configService.get<string>(ENV.FRONTEND_URL) ??
      'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  // Finds job application id for deep links (jobseeker confirm flow).
  private async findApplicationIdForEmployee(
    employee: Employee,
  ): Promise<string | null> {
    if (!employee.jobseekerProfileId) return null;
    const app = await this.applicationRepo.findOne({
      where: {
        jobId: employee.jobId,
        jobseekerProfileId: employee.jobseekerProfileId,
      },
      order: { updatedAt: 'DESC' },
      select: ['id'],
    });
    return app?.id ?? null;
  }

  // Applies ENDED state and probation cleanup (mirrors termination side-effects).
  private finalizeToEnded(row: Employee, at: Date): void {
    row.status = EmployeeStatus.ENDED;
    row.endDate = at;
    row.probationStatus = ProbationStatus.TERMINATED;
    row.pulse30SentAt = null;
    row.pulse60SentAt = null;
    const line = `Mutual completion confirmed (${at.toISOString()})`;
    row.notes = row.notes ? `${row.notes}\n${line}` : line;
  }

  // Notifies the other party to confirm completion in the app.
  private async notifyOtherParty(params: {
    employee: Employee;
    targetRole: 'employer' | 'jobseeker';
    applicationId: string | null;
  }): Promise<void> {
    const { employee, targetRole, applicationId } = params;
    const base = this.frontendBase();
    const jobTitle = employee.job?.title ?? 'your role';

    try {
      if (targetRole === 'jobseeker') {
        const email = employee.jobseekerProfile?.email;
        if (!email) return;
        const path = applicationId
          ? `/jobseeker/dashboard/applications/${applicationId}?employmentCompletion=1`
          : `/jobseeker/dashboard/applications`;
        const actionUrl = `${base}${path}`;
        await this.notificationService.sendEmail({
          to: email,
          subject: `Confirm role completion — ${jobTitle}`,
          template: 'general-notification',
          context: {
            subject: `Confirm role completion — ${jobTitle}`,
            firstName: employee.jobseekerProfile?.firstName ?? 'there',
            message: `The employer has marked "${jobTitle}" as complete on JobStack. Please sign in and confirm if you agree, so the placement can be closed.`,
            actionUrl,
            actionText: 'Review and confirm',
          },
        });
        if (employee.jobseekerProfileId) {
          await this.notificationService.createAppNotification(
            employee.jobseekerProfileId,
            UserRole.JOB_SEEKER,
            {
              title: 'Confirm role completion',
              message: `Your employer marked "${jobTitle}" complete. Please confirm in your application.`,
              priority: NotificationPriority.MEDIUM,
              metadata: {
                employeeId: employee.id,
                jobId: employee.jobId,
              },
            },
          );
        }
      } else {
        const employer = await this.employerRepo.findOne({
          where: { id: employee.employerId },
        });
        if (!employer?.email) return;
        const actionUrl = `${base}/employer/dashboard/employees/${employee.id}?employmentCompletion=1`;
        await this.notificationService.sendEmail({
          to: employer.email,
          subject: `Confirm role completion — ${jobTitle}`,
          template: 'general-notification',
          context: {
            subject: `Confirm role completion — ${jobTitle}`,
            firstName: employer.firstName ?? 'there',
            message: `The candidate has marked "${jobTitle}" as complete on JobStack. Please sign in and confirm if you agree, so the placement can be closed.`,
            actionUrl,
            actionText: 'Review and confirm',
          },
        });
        await this.notificationService.createAppNotification(
          employee.employerId,
          UserRole.EMPLOYER,
          {
            title: 'Confirm role completion',
            message: `A candidate marked "${jobTitle}" complete. Please confirm in Employees.`,
            priority: NotificationPriority.MEDIUM,
            metadata: {
              employeeId: employee.id,
              jobId: employee.jobId,
            },
          },
        );
      }
    } catch {
      // Email failures must not block declaration persistence.
    }
  }

  // Employer declares mutual completion (idempotent for same party).
  async declareCompleteAsEmployer(
    employerId: string,
    employeeId: string,
    note?: string,
  ): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, employerId },
      relations: ['job', 'jobseekerProfile', 'employer'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    if (!isEmployeeOpenForMutualCompletion(employee.status)) {
      throw new BadRequestException(
        'This placement cannot be marked complete in its current state.',
      );
    }
    if (employee.employerDeclaredCompleteAt) {
      return employee;
    }

    const now = new Date();
    let shouldNotifyJobseeker = false;
    let finalized = false;

    await this.employeeRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Employee);
      const row = await repo.findOne({
        where: { id: employeeId, employerId },
        relations: ['job', 'jobseekerProfile'],
      });
      if (!row || !isEmployeeOpenForMutualCompletion(row.status)) {
        throw new BadRequestException('Employee is no longer eligible.');
      }
      if (row.employerDeclaredCompleteAt) {
        return;
      }

      row.employerDeclaredCompleteAt = now;
      if (note?.trim()) {
        const n = note.trim();
        row.notes = row.notes
          ? `${row.notes}\nEmployer declared completion: ${n}`
          : `Employer declared completion: ${n}`;
      }

      const both =
        row.jobseekerDeclaredCompleteAt != null &&
        row.employerDeclaredCompleteAt != null;
      if (both) {
        this.finalizeToEnded(row, now);
        finalized = true;
      } else {
        shouldNotifyJobseeker = true;
      }

      await repo.save(row);
    });

    const fresh = await this.employeeRepo.findOne({
      where: { id: employeeId, employerId },
      relations: [
        'job',
        'jobseekerProfile',
        'jobseekerProfile.userSkills',
        'jobseekerProfile.userSkills.skill',
        'jobseekerProfile.profilePicture',
        'jobseekerProfile.cvDocument',
      ],
    });
    if (!fresh) {
      throw new NotFoundException('Employee not found');
    }

    if (shouldNotifyJobseeker && !finalized) {
      const applicationId = await this.findApplicationIdForEmployee(fresh);
      await this.notifyOtherParty({
        employee: fresh,
        targetRole: 'jobseeker',
        applicationId,
      });
    }

    return fresh;
  }

  // Jobseeker declares mutual completion (idempotent for same party).
  async declareCompleteAsJobseeker(
    jobseekerProfileId: string,
    employeeId: string,
    note?: string,
  ): Promise<Employee> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, jobseekerProfileId },
      relations: ['job', 'jobseekerProfile', 'employer'],
    });
    if (!employee) {
      throw new NotFoundException('Employment record not found');
    }
    if (!isEmployeeOpenForMutualCompletion(employee.status)) {
      throw new BadRequestException(
        'This placement cannot be marked complete in its current state.',
      );
    }
    if (employee.jobseekerDeclaredCompleteAt) {
      return employee;
    }

    const now = new Date();
    let shouldNotifyEmployer = false;
    let finalized = false;

    await this.employeeRepo.manager.transaction(async (manager) => {
      const repo = manager.getRepository(Employee);
      const row = await repo.findOne({
        where: { id: employeeId, jobseekerProfileId },
        relations: ['job', 'jobseekerProfile'],
      });
      if (!row || !isEmployeeOpenForMutualCompletion(row.status)) {
        throw new BadRequestException('Employee is no longer eligible.');
      }
      if (row.jobseekerDeclaredCompleteAt) {
        return;
      }

      row.jobseekerDeclaredCompleteAt = now;
      if (note?.trim()) {
        const n = note.trim();
        row.notes = row.notes
          ? `${row.notes}\nJobseeker declared completion: ${n}`
          : `Jobseeker declared completion: ${n}`;
      }

      const both =
        row.employerDeclaredCompleteAt != null &&
        row.jobseekerDeclaredCompleteAt != null;
      if (both) {
        this.finalizeToEnded(row, now);
        finalized = true;
      } else {
        shouldNotifyEmployer = true;
      }

      await repo.save(row);
    });

    const fresh = await this.employeeRepo.findOne({
      where: { id: employeeId, jobseekerProfileId },
      relations: ['job', 'jobseekerProfile'],
    });
    if (!fresh) {
      throw new NotFoundException('Employment record not found');
    }

    if (shouldNotifyEmployer && !finalized) {
      await this.notifyOtherParty({
        employee: fresh,
        targetRole: 'employer',
        applicationId: null,
      });
    }

    return fresh;
  }
}
