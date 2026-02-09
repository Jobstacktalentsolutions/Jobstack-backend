import {
  BadRequestException,
  Injectable,
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
} from '@app/common/database/entities/schema.enum';

@Injectable()
export class JobApplicationsService {
  constructor(
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerRepo: Repository<JobSeekerProfile>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
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
    return this.executePagedApplicationQuery(qb, query);
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

    if (application.status !== JobApplicationStatus.SCREENING_COMPLETED) {
      throw new BadRequestException(
        'Can only accept candidates after screening is completed',
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
    application.status = JobApplicationStatus.EMPLOYER_ACCEPTED;
    application.statusUpdatedAt = new Date();
    await this.applicationRepo.save(application);

    return {
      application: await this.getApplicationById(applicationId),
      employee: savedEmployee,
    };
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

    if (application.status !== JobApplicationStatus.EMPLOYER_ACCEPTED) {
      throw new BadRequestException(
        'Can only accept/reject offers after employer has accepted you',
      );
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

    return this.getApplicationById(applicationId);
  }
}
