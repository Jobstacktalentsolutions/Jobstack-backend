import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { Employee, JobApplication } from '@app/common/database/entities';
import {
  JobApplicationStatus,
  ProbationStatus,
} from '@app/common/database/entities/schema.enum';

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

  private readonly TEMPLATE_DAY30 = 'probation-day30-pulse-employer';
  private readonly TEMPLATE_DAY60 = 'probation-day60-pulse-employer';
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

  async sendDay30Pulse(employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['employer', 'job', 'jobseekerProfile'],
    });

    if (!employee) {
      this.logger.warn(`Day30 pulse: employee ${employeeId} not found`);
      return;
    }

    if (employee.probationStatus !== ProbationStatus.ACTIVE) return;
    if (employee.pulse30SentAt) return;
    if (!employee.startDate) {
      this.logger.warn(`Day30 pulse: employee ${employeeId} missing startDate`);
      return;
    }

    const employerName = `${employee.employer.firstName} ${employee.employer.lastName}`.trim();
    const candidateFirstName = employee.jobseekerProfile?.firstName ?? '';
    const candidateLastName = employee.jobseekerProfile?.lastName ?? '';
    const candidateFullName = `${candidateFirstName} ${candidateLastName}`.trim();
    const jobTitle = employee.job?.title ?? '';

    const subject = `How is ${candidateFirstName} settling in? (Day 30 Check-in)`;

    const supportMailto = this.buildSupportMailto({
      subject: `Probation Concern - ${candidateFullName}`,
      body: `Hi Jobstack, I have a concern about ${candidateFullName} who started on ${this.formatDate(employee.startDate)}...`,
    });

    await this.notificationService.sendEmail({
      to: employee.employer.email,
      subject,
      template: this.TEMPLATE_DAY30,
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

    employee.pulse30SentAt = new Date();
    await this.employeeRepo.save(employee);
  }

  async sendDay60Pulse(employeeId: string): Promise<void> {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['employer', 'job', 'jobseekerProfile'],
    });

    if (!employee) {
      this.logger.warn(`Day60 pulse: employee ${employeeId} not found`);
      return;
    }

    if (employee.probationStatus !== ProbationStatus.ACTIVE) return;
    if (employee.pulse60SentAt) return;
    if (!employee.startDate) {
      this.logger.warn(`Day60 pulse: employee ${employeeId} missing startDate`);
      return;
    }

    const employerName = `${employee.employer.firstName} ${employee.employer.lastName}`.trim();
    const candidateFirstName = employee.jobseekerProfile?.firstName ?? '';
    const candidateLastName = employee.jobseekerProfile?.lastName ?? '';
    const candidateFullName = `${candidateFirstName} ${candidateLastName}`.trim();
    const jobTitle = employee.job?.title ?? '';
    const probationEndDate = employee.probationEndDate;

    const subject = `60-Day Check-in: How is ${candidateFirstName} doing?`;

    const supportMailto = this.buildSupportMailto({
      subject: `Probation Concern - ${candidateFullName}`,
      body: `Hi Jobstack, I have a concern about ${candidateFullName} who started on ${this.formatDate(employee.startDate)}...`,
    });

    await this.notificationService.sendEmail({
      to: employee.employer.email,
      subject,
      template: this.TEMPLATE_DAY60,
      context: {
        // Ensure EJS <%= subject %> reflects the computed subject.
        subject,
        employerFirstName: employee.employer.firstName,
        candidateFirstName,
        candidateFullName,
        jobTitle,
        companyName: employerName || undefined,
        startDate: this.formatDate(employee.startDate),
        probationEndDate: this.formatDate(probationEndDate),
        supportMailto,
      },
    });

    employee.pulse60SentAt = new Date();
    await this.employeeRepo.save(employee);
  }

  async confirmProbationDay90(employeeId: string): Promise<void> {
    const now = new Date();

    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['employer', 'job', 'jobseekerProfile'],
    });

    if (!employee) {
      this.logger.warn(`Day90 confirm: employee ${employeeId} not found`);
      return;
    }

    if (employee.probationStatus !== ProbationStatus.ACTIVE) return;
    if (!employee.probationEndDate) return;
    if (employee.probationEndDate > now) return;

    const employerName = `${employee.employer.firstName} ${employee.employer.lastName}`.trim();
    const candidateFirstName = employee.jobseekerProfile?.firstName ?? '';
    const candidateLastName = employee.jobseekerProfile?.lastName ?? '';
    const candidateFullName = `${candidateFirstName} ${candidateLastName}`.trim();
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
  }
}

