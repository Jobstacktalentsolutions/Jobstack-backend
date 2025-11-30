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
} from '@app/common/database/entities';
import {
  ApplicationQueryDto,
  CreateJobApplicationDto,
  UpdateApplicationStatusDto,
} from './dto';
import {
  JobApplicationStatus,
  JobStatus,
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
      coverLetter: dto.coverLetter,
      expectedSalary: dto.expectedSalary,
      note: dto.note,
      status: JobApplicationStatus.APPLIED,
    });

    const saved = await this.applicationRepo.save(application);
    
    // Increment applicants count for the job
    await this.jobRepo.increment({ id: jobId }, 'applicantsCount', 1);
    
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
}
