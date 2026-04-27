import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { Employee, JobApplication } from '@app/common/database/entities';
import {
  JobApplicationStatus,
  ProbationStatus,
  NotificationPriority,
} from '@app/common/database/entities/schema.enum';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

export type ProbationMailtoContext = {
  recipientName: string;
  candidateName: string;
  startDate: string;
  jobTitle: string;
  employerName: string;
  employerFirstName: string;
  employerLastName: string;
};

/**
 * Handles probation milestone side effects (emails + DB updates).
 */
@Injectable()
export class ProbationTrackingService {
  private readonly logger = new Logger(ProbationTrackingService.name);

  private readonly TEMPLATE_PROBATION_REMINDER = 'probation-reminder-employer';
  private readonly TEMPLATE_CONFIRMED = 'probation-confirmed';

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    private readonly notificationService: NotificationService,
  ) {}

  // Build a safe mailto: URL with encoded subject and body.
  private buildSupportMailto(params: {
    subject: string;
    body: string;
  }): string {
    const supportEmail = 'support@jobstack.com';
    const subject = encodeURIComponent(params.subject);
    const body = encodeURIComponent(params.body);
    return `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  }

  private formatDate(d?: Date): string {
    if (!d) return '';
    // Use a consistent human-readable format for emails.
    return d.toLocaleDateString('en-GB');
  }

  async sendProbationReminder(employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['employer', 'job', 'jobseekerProfile'],
    });

    if (!employee) {
      this.logger.warn(`Probation reminder: employee ${employeeId} not found`);
      return;
    }

    if (employee.probationStatus !== ProbationStatus.ACTIVE) return;
    if (employee.pulse30SentAt) return;
    if (!employee.startDate) {
      this.logger.warn(
        `Probation reminder: employee ${employeeId} missing startDate`,
      );
      return;
    }

    const employerName =
      `${employee.employer.firstName} ${employee.employer.lastName}`.trim();
    const candidateFirstName = employee.jobseekerProfile?.firstName ?? '';
    const candidateLastName = employee.jobseekerProfile?.lastName ?? '';
    const candidateFullName =
      `${candidateFirstName} ${candidateLastName}`.trim();
    const jobTitle = employee.job?.title ?? '';

    const subject = `Probation Check-in: How is ${candidateFirstName} doing?`;

    const supportMailto = this.buildSupportMailto({
      subject: `Probation Concern - ${candidateFullName}`,
      body: `Hi Jobstack, I have a concern about ${candidateFullName} who started on ${this.formatDate(employee.startDate)}...`,
    });

    await this.notificationService.sendEmail({
      to: employee.employer.email,
      subject,
      template: this.TEMPLATE_PROBATION_REMINDER,
      context: {
        // Ensure EJS <%= subject %> reflects the computed subject.
        subject,
        employerFirstName: employee.employer.firstName,
        candidateFirstName,
        candidateFullName,
        jobTitle,
        companyName: employerName || undefined,
        startDate: this.formatDate(employee.startDate),
        supportMailto,
      },
    });

    try {
      await this.notificationService.createAppNotification(
        employee.employerId,
        UserRole.EMPLOYER,
        {
          title: 'Day 30 Probation Check-in',
          message: `How is ${candidateFirstName} settling into the "${jobTitle}" role? Let us know if you have any feedback or concerns!`,
          priority: NotificationPriority.MEDIUM,
          metadata: { employeeId: employee.id, jobId: employee.jobId },
        },
      );
    } catch (_) {}

    employee.pulse30SentAt = new Date();
    await this.employeeRepo.save(employee);
  }

  async confirmProbation(employeeId: string): Promise<void> {
    const now = new Date();

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['employer', 'job', 'jobseekerProfile'],
    });

    if (!employee) {
      this.logger.warn(`Probation confirm: employee ${employeeId} not found`);
      return;
    }

    if (employee.probationStatus !== ProbationStatus.ACTIVE) return;
    if (!employee.probationEndDate) return;
    if (employee.probationEndDate > now) return;

    const employerName =
      `${employee.employer.firstName} ${employee.employer.lastName}`.trim();
    const candidateFirstName = employee.jobseekerProfile?.firstName ?? '';
    const candidateLastName = employee.jobseekerProfile?.lastName ?? '';
    const candidateFullName =
      `${candidateFirstName} ${candidateLastName}`.trim();
    const jobTitle = employee.job?.title ?? '';

    // Update probation status first, so retries won't double-confirm.
    employee.probationStatus = ProbationStatus.CONFIRMED;
    await this.employeeRepo.save(employee);

    // Probation completion does not affect application status in the simplified flow.
    const subject = `🎉 Placement Confirmed — ${candidateFirstName} at ${employerName}`;

    // Confirmation email to employer.
    await this.notificationService.sendEmail({
      to: employee.employer.email,
      subject,
      template: this.TEMPLATE_CONFIRMED,
      context: {
        // Ensure EJS <%= subject %> reflects the computed subject.
        subject,
        firstName: employee.employer.firstName,
        candidateFirstName,
        candidateFullName,
        jobTitle,
        companyName: employerName,
      },
    });

    // Confirmation email to candidate.
    if (employee.jobseekerProfile?.email) {
      await this.notificationService.sendEmail({
        to: employee.jobseekerProfile.email,
        subject,
        template: this.TEMPLATE_CONFIRMED,
        context: {
          // Ensure EJS <%= subject %> reflects the computed subject.
          subject,
          firstName: candidateFirstName,
          candidateFirstName,
          candidateFullName,
          jobTitle,
          companyName: employerName,
        },
      });
    }

    try {
      await this.notificationService.createAppNotification(
        employee.employerId,
        UserRole.EMPLOYER,
        {
          title: 'Placement Confirmed',
          message: `${candidateFirstName} has successfully completed their probation for "${jobTitle}".`,
          priority: NotificationPriority.HIGH,
          metadata: { employeeId: employee.id, jobId: employee.jobId },
        },
      );

      await this.notificationService.createAppNotification(
        employee.jobseekerProfileId,
        UserRole.JOB_SEEKER,
        {
          title: 'Placement Confirmed',
          message: `You have successfully completed your probation for "${jobTitle}" at ${employerName}.`,
          priority: NotificationPriority.HIGH,
          metadata: { employeeId: employee.id, jobId: employee.jobId },
        },
      );
    } catch (_) {}
  }
}
