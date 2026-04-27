import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { StorageService } from '@app/common/storage/storage.service';
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
  NotificationPriority,
  EmployeeStatus,
  ProbationStatus,
} from '@app/common/database/entities/schema.enum';
import { ProbationTrackingProducer } from '../../queue';
import { buildProbationSchedule } from '../../utils/probation-policy.util';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { EmployeeTerminationHrMeaning } from '@app/common/database/entities/schema.enum';
import { EmploymentFeedbackService } from '../../services/employment-feedback.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerRepo: Repository<JobSeekerProfile>,
    @InjectRepository(EmployerProfile)
    private readonly employerRepo: Repository<EmployerProfile>,
    protected readonly storageService: StorageService,
    private readonly probationTrackingProducer: ProbationTrackingProducer,
    private readonly notificationService: NotificationService,
    private readonly employmentFeedbackService: EmploymentFeedbackService,
  ) {}

  private readonly terminationMeaningLabelMap: Record<
    EmployeeTerminationHrMeaning,
    string
  > = {
    [EmployeeTerminationHrMeaning.EMPLOYEE_RESIGNED]: 'Employee Resigned',
    [EmployeeTerminationHrMeaning.EMPLOYEE_TERMINATED]: 'Employee Terminated',
    [EmployeeTerminationHrMeaning.ROLE_REDUNDANT]: 'Role Redundant',
    [EmployeeTerminationHrMeaning.MUTUAL_SEPARATION]: 'Mutual Separation',
    [EmployeeTerminationHrMeaning.OTHER]: 'Other',
  };

  // Relations needed by employer/admin views to render profile data.
  private readonly relations = [
    'job',
    'jobseekerProfile',
    'jobseekerProfile.userSkills',
    'jobseekerProfile.userSkills.skill',
    'jobseekerProfile.profilePicture',
    'jobseekerProfile.cvDocument',
  ];

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
        where: {
          jobId: dto.jobId,
          jobseekerProfileId: dto.jobseekerProfileId,
          status: In([
            EmployeeStatus.ONBOARDING,
            EmployeeStatus.ACTIVE,
            EmployeeStatus.SUSPENDED,
          ]),
        },
      })
    ) {
      throw new BadRequestException(
        'An active employee record already exists for this job',
      );
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

    // Ensure employer-facing document URLs are signed before returning to the frontend.
    const cvDocument = employee.jobseekerProfile?.cvDocument;
    if (cvDocument?.fileKey) {
      const signedUrl = await this.storageService.getSignedUrl(
        cvDocument.fileKey,
        3600, // 1 hour expiry
        false, // view (not forced download)
        cvDocument.bucketType,
        cvDocument.provider,
      );
      cvDocument.url = signedUrl;
    }

    return employee;
  }

  // Retrieves a single employee ensuring jobseeker ownership
  async getJobseekerEmployeeById(
    jobseekerProfileId: string,
    employeeId: string,
  ) {
    const employee = await this.employeeRepo.findOne({
      where: { id: employeeId, jobseekerProfileId },
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
    const previousStatus = employee.status;
    this.logger.log(
      `Update employee status: ${JSON.stringify({
        employeeId,
        employerId,
        from: previousStatus,
        to: dto.status,
      })}`,
    );

    if (dto.status === EmployeeStatus.ENDED) {
      this.logger.warn(
        `Rejected status update to ENDED for employee ${employeeId}`,
      );
      throw new BadRequestException(
        'ENDED is applied only when employer and jobseeker both confirm mutual completion.',
      );
    }

    // Check payment requirement before allowing activation
    if (
      dto.status === EmployeeStatus.ACTIVE &&
      employee.status === EmployeeStatus.ONBOARDING
    ) {
      // Check if employee has salary/contract fee that requires payment
      const hasPaymentAmount =
        employee.salaryOffered || employee.contractFeeOffered;

      if (hasPaymentAmount && employee.paymentStatus !== 'PAID') {
        this.logger.warn(
          `Activation blocked for employee ${employeeId}: paymentStatus=${employee.paymentStatus}`,
        );
        throw new BadRequestException(
          'Payment is required before employee can be activated. Please complete the payment process first.',
        );
      }
    }

    employee.status = dto.status;

    if (dto.status === EmployeeStatus.TERMINATED) {
      this.logger.log(
        `Processing termination for employee ${employeeId} with hrMeaning=${dto.hrMeaning ?? 'none'}`,
      );
      const cleanedReason = dto.reasonForTermination?.trim();
      if (!cleanedReason) {
        this.logger.warn(
          `Termination rejected for employee ${employeeId}: missing reasonForTermination`,
        );
        throw new BadRequestException(
          'reasonForTermination is required when ending employment',
        );
      }
      if (dto.exitRating == null || dto.exitRating < 1 || dto.exitRating > 5) {
        this.logger.warn(
          `Termination rejected for employee ${employeeId}: invalid exitRating=${dto.exitRating}`,
        );
        throw new BadRequestException(
          'exitRating between 1 and 5 is required when ending employment',
        );
      }

      const meaningLabel = dto.hrMeaning
        ? this.terminationMeaningLabelMap[dto.hrMeaning]
        : null;

      const reasonLine = meaningLabel
        ? `${meaningLabel}: ${cleanedReason}`
        : cleanedReason;

      const timestamp = new Date();
      const noteLine = `Employment Ended (${timestamp.toISOString()}) - ${reasonLine}`;

      const employeeIdToEnd = employee.id;
      await this.employeeRepo.manager.transaction(async (manager) => {
        this.logger.debug(
          `Starting termination transaction for employee ${employeeIdToEnd}`,
        );
        const empRepo = manager.getRepository(Employee);
        const row = await empRepo.findOne({
          where: { id: employeeIdToEnd, employerId },
        });
        if (!row) {
          this.logger.warn(
            `Termination failed: employee ${employeeIdToEnd} not found for employer ${employerId}`,
          );
          throw new NotFoundException('Employee not found');
        }

        row.status = EmployeeStatus.TERMINATED;
        row.terminationHrMeaning = dto.hrMeaning ?? null;
        row.terminationDetail = cleanedReason;
        row.terminatedAt = timestamp;
        row.notes = row.notes ? `${row.notes}\n${noteLine}` : noteLine;
        row.endDate = timestamp;
        row.probationStatus = ProbationStatus.TERMINATED;
        row.pulse30SentAt = null;
        row.pulse60SentAt = null;

        await empRepo.save(row);

        await this.employmentFeedbackService.createEmployerFeedbackWithManager(
          manager,
          row.id,
          dto.exitRating,
          dto.exitComment ?? null,
        );
        this.logger.debug(
          `Termination transaction completed for employee ${employeeIdToEnd}`,
        );
      });

      const ended = await this.getEmployerEmployeeById(employerId, employeeId);
      this.logger.log(
        `Termination persisted for employee ${employeeId}: status=${ended.status}`,
      );
      await this.sendEmploymentEndedNotifications(ended, dto);

      return ended;
    }

    // When activation is finalized, initialize probation fields if missing/outdated.
    if (dto.status === EmployeeStatus.ACTIVE) {
      if (!employee.startDate) {
        this.logger.warn(
          `Activation rejected for employee ${employeeId}: missing startDate`,
        );
        throw new BadRequestException(
          'Employee startDate is required before activation',
        );
      }

      const probationSchedule = buildProbationSchedule({
        employmentArrangement: employee.employmentArrangement,
        startDate: employee.startDate,
        endDate: employee.endDate,
      });

      employee.probationStatus = ProbationStatus.ACTIVE;
      employee.probationEndDate = probationSchedule.probationEndDate;
      employee.pulse30SentAt = null;
      employee.pulse60SentAt = null;

      await this.employeeRepo.save(employee);
      this.logger.log(
        `Activated employee ${employeeId}; probationEndDate=${probationSchedule.probationEndDate.toISOString()}`,
      );

      // Queue probation milestones only on transition into ACTIVE.
      if (previousStatus !== EmployeeStatus.ACTIVE) {
        this.logger.debug(
          `Scheduling probation milestones for employee ${employeeId}`,
        );
        await this.probationTrackingProducer.scheduleEmployeeProbationMilestones(
          {
            employeeId: employee.id,
            reminderAt: probationSchedule.reminderAt,
            confirmAt: probationSchedule.confirmAt,
          },
        );
        this.logger.debug(
          `Probation milestones queued for employee ${employeeId}`,
        );
      }

      return this.getEmployerEmployeeById(employerId, employeeId);
    }

    await this.employeeRepo.save(employee);
    this.logger.log(`Updated employee ${employeeId} status to ${dto.status}`);

    return this.getEmployerEmployeeById(employerId, employeeId);
  }

  private async sendEmploymentEndedNotifications(
    employee: Employee,
    dto: UpdateEmployeeStatusDto,
  ) {
    try {
      const employer = await this.employerRepo.findOne({
        where: { id: employee.employerId },
      });
      const hrMeaning = dto.hrMeaning
        ? this.terminationMeaningLabelMap[dto.hrMeaning]
        : 'Employment Ended';
      const jobTitle = employee.job?.title ?? 'your role';
      const employerName = `${employer?.firstName ?? ''} ${
        employer?.lastName ?? ''
      }`.trim();

      if (employee.jobseekerProfile?.email) {
        await this.notificationService.sendEmail({
          to: employee.jobseekerProfile.email,
          subject: `Employment update for ${jobTitle}`,
          template: 'general-notification',
          context: {
            title: 'Employment Ended',
            message: `Your employment for "${jobTitle}" at ${
              employerName || 'your employer'
            } has been ended.`,
            hrMeaning,
            reason: dto.reasonForTermination,
          },
        });
      }

      if (employee.jobseekerProfileId) {
        await this.notificationService.createAppNotification(
          employee.jobseekerProfileId,
          UserRole.JOB_SEEKER,
          {
            title: 'Employment Ended',
            message: `Your employment as "${jobTitle}" has ended. Reason: ${dto.reasonForTermination}`,
            priority: NotificationPriority.HIGH,
            metadata: {
              employeeId: employee.id,
              employerId: employee.employerId,
              jobId: employee.jobId,
              hrMeaning,
            },
          },
        );
      }

      if (employee.employerId) {
        await this.notificationService.createAppNotification(
          employee.employerId,
          UserRole.EMPLOYER,
          {
            title: 'Employment Ended',
            message: `${employee.jobseekerProfile?.firstName ?? 'Employee'} has been marked as Employment Ended.`,
            priority: NotificationPriority.MEDIUM,
            metadata: {
              employeeId: employee.id,
              jobId: employee.jobId,
              hrMeaning,
            },
          },
        );
      }
    } catch (error) {
      this.logger.warn(
        `Employment-ended notifications failed for employee ${employee.id}: ${error?.message ?? error}`,
      );
      // Notification failures should not block status changes.
    }
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
    if (query.employerId) {
      qb.andWhere('employee.employerId = :employerId', {
        employerId: query.employerId,
      });
    }
    if (query.jobseekerProfileId) {
      qb.andWhere('employee.jobseekerProfileId = :jobseekerProfileId', {
        jobseekerProfileId: query.jobseekerProfileId,
      });
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
