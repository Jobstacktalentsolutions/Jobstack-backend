import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Employee,
  EmployerProfile,
  Job,
  JobSeekerProfile,
} from '@app/common/database/entities';
import {
  CreateEmployeeDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
  UpdateEmployeeStatusDto,
} from '../../dto';
import {
  EmployeeStatus,
  EmploymentArrangement,
  EmploymentType,
} from '@app/common/database/entities/schema.enum';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerRepo: Repository<JobSeekerProfile>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepo: Repository<EmployerProfile>,
  ) {}

  private readonly relations = ['job', 'jobseekerProfile'];

  // Creates a new employee record tied to a job and jobseeker
  async createEmployee(employerId: string, dto: CreateEmployeeDto) {
    await this.ensureEmployer(employerId);
    const job = await this.jobRepo.findOne({
      where: { id: dto.jobId, employerId },
    });
    if (!job) {
      throw new NotFoundException('Job not found for employer');
    }

    if (
      await this.employeeRepo.findOne({
        where: { jobId: dto.jobId, jobseekerProfileId: dto.jobseekerProfileId },
      })
    ) {
      throw new BadRequestException('Employee already exists for this job');
    }

    const profile = await this.jobseekerRepo.findOne({
      where: { id: dto.jobseekerProfileId },
    });
    if (!profile) {
      throw new NotFoundException('Jobseeker profile not found');
    }

    const employee = this.employeeRepo.create({
      employerId,
      jobId: dto.jobId,
      jobseekerProfileId: dto.jobseekerProfileId,
      employmentType: dto.employmentType,
      employmentArrangement: dto.employmentArrangement,
      status: dto.status ?? EmployeeStatus.ONBOARDING,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      salaryOffered: dto.salaryOffered,
      currency: dto.currency,
      notes: dto.notes,
    });

    const saved = await this.employeeRepo.save(employee);
    return this.getEmployerEmployeeById(employerId, saved.id);
  }

  // Lists employees for an employer
  async getEmployerEmployees(employerId: string, query: EmployeeQueryDto) {
    await this.ensureEmployer(employerId);
    const qb = this.baseEmployeeQuery().where(
      'employee.employerId = :employerId',
      {
        employerId,
      },
    );
    this.applyEmployeeFilters(qb, query);
    return this.executePagedEmployeeQuery(qb, query);
  }

  // Retrieves a single employee ensuring employer ownership
  async getEmployerEmployeeById(employerId: string, employeeId: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, employerId },
      relations: this.relations,
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  // Updates employee metadata
  async updateEmployee(
    employerId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
  ) {
    const employee = await this.getEmployerEmployeeById(employerId, employeeId);
    if (dto.employmentType) {
      employee.employmentType = dto.employmentType;
    }
    if (dto.employmentArrangement) {
      employee.employmentArrangement = dto.employmentArrangement;
    }
    if (dto.startDate) {
      employee.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      employee.endDate = new Date(dto.endDate);
    }
    if (dto.salaryOffered !== undefined) {
      employee.salaryOffered = dto.salaryOffered;
    }
    if (dto.currency !== undefined) {
      employee.currency = dto.currency;
    }
    if (dto.notes !== undefined) {
      employee.notes = dto.notes;
    }

    await this.employeeRepo.save(employee);
    return this.getEmployerEmployeeById(employerId, employeeId);
  }

  // Updates employee status specifically
  async updateEmployeeStatus(
    employerId: string,
    employeeId: string,
    dto: UpdateEmployeeStatusDto,
  ) {
    const employee = await this.getEmployerEmployeeById(employerId, employeeId);
    employee.status = dto.status;
    await this.employeeRepo.save(employee);
    return this.getEmployerEmployeeById(employerId, employeeId);
  }

  // Lists employees for admins
  async getAdminEmployees(query: EmployeeQueryDto) {
    const qb = this.baseEmployeeQuery();
    this.applyEmployeeFilters(qb, query);
    return this.executePagedEmployeeQuery(qb, query);
  }

  // Retrieves a single employee for admin
  async getAdminEmployeeById(employeeId: string) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId },
      relations: [...this.relations, 'employer'],
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  // Ensures employer exists for scoping
  private async ensureEmployer(employerId: string) {
    const exists = await this.employerRepo.exist({ where: { id: employerId } });
    if (!exists) {
      throw new NotFoundException('Employer not found');
    }
  }

  // Base query reused for employee listings
  private baseEmployeeQuery(): SelectQueryBuilder<Employee> {
    return this.employeeRepo
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.job', 'job')
      .leftJoinAndSelect('employee.jobseekerProfile', 'jobseeker');
  }

  // Applies filters for employees listing
  private applyEmployeeFilters(
    qb: SelectQueryBuilder<Employee>,
    query: EmployeeQueryDto,
  ) {
    if (query.status) {
      qb.andWhere('employee.status = :status', { status: query.status });
    }
    if (query.jobId) {
      qb.andWhere('employee.jobId = :jobId', { jobId: query.jobId });
    }
  }

  // Executes pagination on employees
  private async executePagedEmployeeQuery(
    qb: SelectQueryBuilder<Employee>,
    query: EmployeeQueryDto,
  ) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    qb.take(limit)
      .skip((page - 1) * limit)
      .orderBy('employee.createdAt', 'DESC');
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }
}
