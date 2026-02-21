import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { EmployerProfile, Job, Skill } from '@app/common/database/entities';
import {
  CreateJobDto,
  JobQueryDto,
  UpdateJobDto,
  UpdateJobStatusDto,
} from '../dto';
import { JobStatus } from '@app/common/database/entities/schema.enum';
import { JobVettingProducer } from '../queue/job-vetting.producer';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepo: Repository<EmployerProfile>,
    private readonly jobVettingProducer: JobVettingProducer,
  ) {}

  private readonly jobRelations = ['skills'];
  private readonly jobListRelations = ['skills']; // Minimal relations for listings

  // Creates a new job on behalf of an employer
  async createJob(employerId: string, dto: CreateJobDto) {
    await this.ensureEmployerExists(employerId);
    const skills = await this.loadSkills(dto.skillIds);

    const job = this.jobRepo.create({
      title: dto.title,
      description: dto.description,
      category: dto.category,
      employmentType: dto.employmentType,
      employmentArrangement: dto.employmentArrangement,
      workMode: dto.workMode,
      salary: dto.salary,
      contractFee: dto.contractFee,
      contractPaymentType: dto.contractPaymentType,
      contractDurationDays: dto.contractDurationDays,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      state: dto.state,
      city: dto.city,
      address: dto.address,
      workDays: dto.workDays,
      startTime: dto.startTime,
      endTime: dto.endTime,
      tags: dto.tags ?? [],
      applicationDeadline: dto.applicationDeadline
        ? new Date(dto.applicationDeadline)
        : undefined,
      performCustomScreening: dto.performCustomScreening ?? false,
      employerId,
      skills,
      status: JobStatus.DRAFT,
    });

    const created = await this.jobRepo.save(job);
    return this.getEmployerJobById(employerId, created.id);
  }

  // Unified method to fetch jobs with configurable filters
  async getJobs(
    query: JobQueryDto,
    options?: {
      employerId?: string;
      status?: JobStatus;
      includeExpired?: boolean;
    },
  ) {
    const qb = this.baseJobListQuery(); // Use optimized query for listings
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    // Filter by employer if specified
    if (options?.employerId) {
      conditions.push('job.employerId = :employerId');
      params.employerId = options.employerId;
    }

    // Filter by status if specified
    if (options?.status) {
      conditions.push('job.status = :status');
      params.status = options.status;
    }

    // Filter out expired jobs for published jobs (unless includeExpired is true)
    if (options?.status === JobStatus.PUBLISHED && !options?.includeExpired) {
      conditions.push(
        '(job.applicationDeadline IS NULL OR job.applicationDeadline > :now)',
      );
      params.now = new Date();
    }

    // Apply base conditions
    if (conditions.length > 0) {
      qb.where(conditions.join(' AND '), params);
    }

    // Apply common filters (category, search, status from query)
    this.applyJobFilters(qb, query);

    const [items, total, page, limit] = await this.executePagedQuery(qb, query);
    return { items, total, page, limit };
  }

  // Retrieves a single employer job ensuring ownership
  async getEmployerJobById(employerId: string, jobId: string) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId, employerId },
      relations: this.jobRelations,
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  // Retrieves a single job by ID (public endpoint)
  async getJobById(jobId: string) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: this.jobRelations,
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  // Retrieves job statistics
  async getJobStats() {
    const total = await this.jobRepo.count();
    const draft = await this.jobRepo.count({
      where: { status: JobStatus.DRAFT },
    });
    const published = await this.jobRepo.count({
      where: { status: JobStatus.PUBLISHED },
    });
    const active = await this.jobRepo.count({
      where: { status: JobStatus.ACTIVE },
    });
    const closed = await this.jobRepo.count({
      where: { status: JobStatus.CLOSED },
    });

    return {
      total,
      draft,
      published,
      active,
      closed,
    };
  }

  // Updates a job (employerId optional - if provided, verifies ownership)
  async updateJob(jobId: string, dto: UpdateJobDto, employerId?: string) {
    const job = await this.getJobById(jobId);

    // Verify ownership if employerId is provided
    if (employerId && job.employerId !== employerId) {
      throw new NotFoundException('Job not found');
    }

    if (dto.skillIds) {
      job.skills = await this.loadSkills(dto.skillIds);
    }

    Object.assign(job, {
      title: dto.title ?? job.title,
      description: dto.description ?? job.description,
      category: dto.category ?? job.category,
      employmentType: dto.employmentType ?? job.employmentType,
      employmentArrangement:
        dto.employmentArrangement ?? job.employmentArrangement,
      workMode: dto.workMode ?? job.workMode,
      salary: dto.salary ?? job.salary,
      contractFee: dto.contractFee ?? job.contractFee,
      contractPaymentType: dto.contractPaymentType ?? job.contractPaymentType,
      contractDurationDays:
        dto.contractDurationDays ?? job.contractDurationDays,
      startDate: dto.startDate ? new Date(dto.startDate) : job.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : job.endDate,
      state: dto.state ?? job.state,
      city: dto.city ?? job.city,
      address: dto.address ?? job.address,
      workDays: dto.workDays ?? job.workDays,
      startTime: dto.startTime ?? job.startTime,
      endTime: dto.endTime ?? job.endTime,
      tags: dto.tags ?? job.tags,
      applicationDeadline: dto.applicationDeadline
        ? new Date(dto.applicationDeadline)
        : job.applicationDeadline,
      performCustomScreening:
        dto.performCustomScreening ?? job.performCustomScreening,
    });

    await this.jobRepo.save(job);
    return this.getJobById(jobId);
  }

  // Updates job status (employerId optional - if provided, verifies ownership)
  async updateJobStatus(
    jobId: string,
    dto: UpdateJobStatusDto,
    employerId?: string,
  ) {
    const job = await this.getJobById(jobId);

    // Verify ownership if employerId is provided
    if (employerId && job.employerId !== employerId) {
      throw new NotFoundException('Job not found');
    }

    const previousStatus = job.status;
    job.status = dto.status;
    await this.jobRepo.save(job);

    // Trigger vetting when job is published
    if (
      dto.status === JobStatus.PUBLISHED &&
      previousStatus !== JobStatus.PUBLISHED
    ) {
      try {
        await this.jobVettingProducer.queueJobVetting(jobId, 'status-change');
      } catch (error) {
        // Log error but don't fail the status update
        console.error(`Failed to queue vetting for job ${jobId}:`, error);
      }
    }

    return this.getJobById(jobId);
  }

  // Deletes a job (employerId optional - if provided, verifies ownership)
  async deleteJob(jobId: string, employerId?: string) {
    const job = await this.getJobById(jobId);

    // Verify ownership if employerId is provided
    if (employerId && job.employerId !== employerId) {
      throw new NotFoundException('Job not found');
    }

    await this.jobRepo.remove(job);
    return { success: true };
  }

  // Ensures employer exists before job actions
  private async ensureEmployerExists(employerId: string) {
    const exists = await this.employerRepo.exist({ where: { id: employerId } });
    if (!exists) {
      throw new NotFoundException('Employer not found');
    }
  }

  // Loads skills referenced in payload
  private async loadSkills(skillIds: string[]) {
    const skills = await this.skillRepo.find({ where: { id: In(skillIds) } });
    if (skills.length !== skillIds.length) {
      throw new BadRequestException('One or more skills are invalid');
    }
    return skills;
  }

  // Builds base query with eager relations (for detailed views)
  private baseJobQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.skills', 'skill')
      .leftJoinAndSelect('job.employer', 'employer');
  }

  // Builds optimized query for job listings (minimal fields)
  private baseJobListQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .select([
        'job.id',
        'job.title',
        'job.description',
        'job.category',
        'job.employmentType',
        'job.employmentArrangement',
        'job.workMode',
        'job.salary',
        'job.contractFee',
        'job.state',
        'job.city',
        'job.address',
        'job.workDays',
        'job.startTime',
        'job.endTime',
        'job.tags',
        'job.applicationDeadline',
        'job.status',
        'job.applicantsCount',
        'job.performCustomScreening',
        'job.employerId',
        'job.createdAt',
        'job.updatedAt',
        'job.vettingCompletedAt',
        'job.vettingCompletedBy',
        'job.highlightedCandidateCount',
      ])
      .leftJoin('job.skills', 'skill')
      .addSelect(['skill.id', 'skill.name', 'skill.description'])
      .leftJoin('job.employer', 'employer')
      .addSelect([
        'employer.id',
        'employer.firstName',
        'employer.lastName',
        'employer.email',
      ]);
  }

  // Applies reusable filters on a query builder
  private applyJobFilters(qb: SelectQueryBuilder<Job>, query: JobQueryDto) {
    if (query.status) {
      qb.andWhere('job.status = :status', { status: query.status });
    }
    if (query.category) {
      qb.andWhere('job.category = :category', { category: query.category });
    }
    if (query.search) {
      qb.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search OR job.city ILIKE :search OR job.state ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
  }

  // Executes pagination logic consistently
  private async executePagedQuery(
    qb: SelectQueryBuilder<Job>,
    query: JobQueryDto,
  ): Promise<[Job[], number, number, number]> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    qb.take(limit)
      .skip((page - 1) * limit)
      .orderBy('job.createdAt', 'DESC');
    const [items, total] = await qb.getManyAndCount();
    return [items, total, page, limit];
  }
}
