import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminProfile } from '@app/common/database/entities/AdminProfile.entity';
import {
  Employee,
  EmployerVerification,
  EmployerProfile,
  EmployerAuth,
  Job,
  JobseekerAuth,
  JobSeekerProfile,
  Payment,
} from '@app/common/database/entities';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import {
  ApprovalStatus,
  EmployeeStatus,
  EmployerStatus,
  PaymentStatus,
} from '@app/common/database/entities/schema.enum';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { GetAllAdminsQueryDto } from './dto/get-all-admins-query.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';

function generateRandomPassword(length = 12): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminAuth)
    private readonly adminAuthRepo: Repository<AdminAuth>,
    @InjectRepository(AdminProfile)
    private readonly adminProfileRepo: Repository<AdminProfile>,
    @InjectRepository(EmployerVerification)
    private readonly verificationRepo: Repository<EmployerVerification>,
    @InjectRepository(EmployerProfile)
    private readonly profileRepo: Repository<EmployerProfile>,
    @InjectRepository(EmployerAuth)
    private readonly employerAuthRepo: Repository<EmployerAuth>,
    @InjectRepository(JobseekerAuth)
    private readonly jobseekerAuthRepo: Repository<JobseekerAuth>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerProfileRepo: Repository<JobSeekerProfile>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly notificationService: NotificationService,
  ) {}

  private buildMonthlyTrend(current: number, previous: number) {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) {
      return { value: 0, percent: 0 };
    }

    const value = current - previous;
    if (previous <= 0) {
      return {
        value,
        percent: current > 0 ? 100 : 0,
      };
    }

    return {
      value,
      percent: Math.round((value / previous) * 100),
    };
  }

  async getAdminProfile(userId: string): Promise<any> {
    const profile = await this.adminProfileRepo.findOne({
      where: { id: userId },
      relations: ['auth'],
    });
    if (!profile) {
      throw new NotFoundException('Admin not found');
    }

    return {
      id: profile.id,
      email: profile.auth.email,
      roleKey: profile.auth.roleKey,
      privilegeLevel: profile.auth.privilegeLevel,
      managerId: profile.auth.managerId || null,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        profilePictureUrl: profile.profilePictureUrl,
        address: profile.address,
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      suspended: profile.auth.suspended,
    };
  }

  /** Returns a single admin by profile id for management (same shape as list item) */
  async getAdminById(profileId: string): Promise<any> {
    const profile = await this.adminProfileRepo.findOne({
      where: { id: profileId },
      relations: ['auth'],
    });
    if (!profile) {
      throw new NotFoundException('Admin not found');
    }
    return {
      id: profile.id,
      email: profile.auth.email,
      roleKey: profile.auth.roleKey,
      privilegeLevel: profile.auth.privilegeLevel,
      managerId: profile.auth.managerId || null,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        profilePictureUrl: profile.profilePictureUrl,
        address: profile.address,
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      suspended: profile.auth.suspended,
    };
  }

  async createAdmin(creatorId: string, data: any) {
    const creator = await this.adminAuthRepo.findOne({
      where: { id: creatorId },
    });
    if (!creator) throw new NotFoundException('Creator admin not found');

    const { email, firstName, lastName, phoneNumber, address, roleKey } = data;
    if (!email || !roleKey)
      throw new BadRequestException('email and roleKey are required');

    const target = (AdminRole as any)[roleKey];
    if (!target) throw new BadRequestException('Invalid roleKey');

    // Creator can create admins with same or lower privilege
    if (target.privilegeLevel > creator.privilegeLevel) {
      throw new ForbiddenException('Cannot create admin with higher privilege');
    }

    const existing = await this.adminAuthRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already in use');

    const rawPassword = generateRandomPassword();
    const hashed = await bcrypt.hash(rawPassword, 12);

    const auth = this.adminAuthRepo.create({
      email: email.toLowerCase(),
      password: hashed,
      hasChangedPassword: false,
      roleKey,
      privilegeLevel: target.privilegeLevel,
      managerId: creator.id,
    });

    const saved = await this.adminAuthRepo.save(auth);

    // Create profile with same ID
    const profile = this.adminProfileRepo.create({
      id: saved.id,
      firstName: firstName || 'Admin',
      lastName: lastName || 'User',
      email: email.toLowerCase(),
      phoneNumber: phoneNumber || '',
      address: address || null,
    });

    await this.adminProfileRepo.save(profile);

    // Send credentials email
    await this.notificationService.sendEmail({
      to: email,
      subject: 'Your JobStack Admin Account',
      template: 'general-notification',
      context: {
        firstName: firstName || 'Admin',
        message: `Your admin account has been created.\nEmail: ${email}\nTemporary Password: ${rawPassword}`,
        actionText: 'Login to Dashboard',
        actionUrl:
          process.env.ADMIN_DASHBOARD_URL || 'https://jobstack.ng/admin',
      },
    });

    return { id: saved.id, email: saved.email, roleKey: saved.roleKey };
  }

  async updateEmployerVerification(
    employerId: string,
    status: VerificationStatus,
    rejectionReason?: string,
  ) {
    const verification = await this.verificationRepo.findOne({
      where: { employerId },
      relations: ['documents', 'documents.document'],
    });
    if (!verification) throw new NotFoundException('Verification not found');

    verification.status = status;
    verification.reviewedAt = new Date();
    verification.rejectionReason =
      status === VerificationStatus.REJECTED ? rejectionReason : undefined;
    await this.verificationRepo.save(verification);

    return { employerId, status };
  }

  async updateAdminProfile(userId: string, updateData: any): Promise<any> {
    const profile = await this.adminProfileRepo.findOne({
      where: { id: userId },
      relations: ['auth'],
    });
    if (!profile) {
      throw new NotFoundException('Admin not found');
    }

    // Update profile fields
    if (updateData.firstName) profile.firstName = updateData.firstName;
    if (updateData.lastName) profile.lastName = updateData.lastName;
    if (updateData.phoneNumber) profile.phoneNumber = updateData.phoneNumber;
    if (updateData.address !== undefined) profile.address = updateData.address;
    if (updateData.profilePictureUrl !== undefined)
      profile.profilePictureUrl = updateData.profilePictureUrl;

    // Update auth email if provided
    if (updateData.email) {
      profile.auth.email = updateData.email.toLowerCase();
      profile.email = updateData.email.toLowerCase();
      await this.adminAuthRepo.save(profile.auth);
    }

    await this.adminProfileRepo.save(profile);
    return this.getAdminProfile(userId);
  }

  async getAllAdmins(
    _userId: string,
    query: GetAllAdminsQueryDto,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';
    const search =
      typeof query.query === 'string' ? query.query.trim() : undefined;

    const qb = this.adminProfileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.auth', 'auth');

    if (search) {
      qb.andWhere(
        '(profile.firstName ILIKE :search OR profile.lastName ILIKE :search OR profile.email ILIKE :search OR auth.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const orderField = [
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
    ].includes(sortBy)
      ? `profile.${sortBy}`
      : 'profile.createdAt';
    qb.orderBy(orderField, sortOrder);
    qb.skip(skip).take(limit);

    const [profiles, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    const data = profiles.map((profile) => ({
      id: profile.id,
      email: profile.auth?.email ?? profile.email,
      roleKey: profile.auth?.roleKey,
      privilegeLevel: profile.auth?.privilegeLevel,
      managerId: profile.auth?.managerId || null,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        profilePictureUrl: profile.profilePictureUrl,
        address: profile.address,
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      suspended: profile.auth?.suspended,
    }));

    return { data, total, page, limit, totalPages };
  }

  async getSystemOverview(_userId: string): Promise<any> {
    // TODO: Implement actual system metrics later
    return {
      totalUsers: 0,
      totalJobSeekers: 0,
      totalRecruiters: 0,
      totalAdmins: await this.adminAuthRepo.count(),
      systemUptime: '99.9%',
      lastBackup: new Date().toISOString(),
      activeSessions: 0,
      storageUsed: '0 MB',
    };
  }

  async getDashboardOverview(pendingLimit = 5): Promise<any> {
    const now = new Date();
    const startOfCurrentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
    );
    const startOfNextMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );
    const startOfPreviousMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0),
    );

    const [
      totalVettedTalent,
      vettedThisMonth,
      vettedLastMonth,
      totalJobsPosted,
      jobsThisMonth,
      jobsLastMonth,
      totalSuccessfulHires,
      hiresThisMonth,
      hiresLastMonth,
      totalAgencyFeesRaw,
      feesThisMonthRaw,
      feesLastMonthRaw,
      pendingEmployerVerifications,
      pendingEmployerVerificationsTotal,
      pendingJobseekerApprovals,
      pendingJobseekerApprovalsTotal,
      recentJobPostsRaw,
      employmentsPendingMutualCompletion,
      completionAwaitingJobseeker,
      completionAwaitingEmployer,
      employmentsEndedMutualThisMonth,
    ] = await Promise.all([
      this.jobseekerProfileRepo.count({
        where: { approvalStatus: ApprovalStatus.APPROVED },
      }),
      this.jobseekerProfileRepo.count({
        where: {
          approvalStatus: ApprovalStatus.APPROVED,
          updatedAt: Between(startOfCurrentMonth, startOfNextMonth),
        },
      }),
      this.jobseekerProfileRepo.count({
        where: {
          approvalStatus: ApprovalStatus.APPROVED,
          updatedAt: Between(startOfPreviousMonth, startOfCurrentMonth),
        },
      }),
      this.jobRepo.count(),
      this.jobRepo.count({
        where: { createdAt: Between(startOfCurrentMonth, startOfNextMonth) },
      }),
      this.jobRepo.count({
        where: {
          createdAt: Between(startOfPreviousMonth, startOfCurrentMonth),
        },
      }),
      this.employeeRepo.count(),
      this.employeeRepo.count({
        where: { createdAt: Between(startOfCurrentMonth, startOfNextMonth) },
      }),
      this.employeeRepo.count({
        where: {
          createdAt: Between(startOfPreviousMonth, startOfCurrentMonth),
        },
      }),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
        .getRawOne<{ amount: string | number }>(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
        .andWhere('payment.createdAt >= :start AND payment.createdAt < :end', {
          start: startOfCurrentMonth,
          end: startOfNextMonth,
        })
        .getRawOne<{ amount: string | number }>(),
      this.paymentRepo
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'amount')
        .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
        .andWhere('payment.createdAt >= :start AND payment.createdAt < :end', {
          start: startOfPreviousMonth,
          end: startOfCurrentMonth,
        })
        .getRawOne<{ amount: string | number }>(),
      this.verificationRepo.find({
        where: { status: VerificationStatus.PENDING },
        relations: ['employer'],
        order: { createdAt: 'DESC' },
        take: pendingLimit,
      }),
      this.verificationRepo.count({
        where: { status: VerificationStatus.PENDING },
      }),
      this.jobseekerProfileRepo.find({
        where: { approvalStatus: ApprovalStatus.PENDING },
        order: { updatedAt: 'DESC' },
        take: pendingLimit,
      }),
      this.jobseekerProfileRepo.count({
        where: { approvalStatus: ApprovalStatus.PENDING },
      }),
      this.jobRepo.find({
        relations: ['employer', 'employer.verification'],
        order: { createdAt: 'DESC' },
        take: pendingLimit,
      }),
      this.employeeRepo
        .createQueryBuilder('e')
        .where('e.status IN (:...open)', {
          open: [EmployeeStatus.ACTIVE, EmployeeStatus.ONBOARDING],
        })
        .andWhere(
          '(e.employerDeclaredCompleteAt IS NOT NULL AND e.jobseekerDeclaredCompleteAt IS NULL) OR (e.employerDeclaredCompleteAt IS NULL AND e.jobseekerDeclaredCompleteAt IS NOT NULL)',
        )
        .getCount(),
      this.employeeRepo
        .createQueryBuilder('e')
        .where('e.status IN (:...open)', {
          open: [EmployeeStatus.ACTIVE, EmployeeStatus.ONBOARDING],
        })
        .andWhere('e.employerDeclaredCompleteAt IS NOT NULL')
        .andWhere('e.jobseekerDeclaredCompleteAt IS NULL')
        .getCount(),
      this.employeeRepo
        .createQueryBuilder('e')
        .where('e.status IN (:...open)', {
          open: [EmployeeStatus.ACTIVE, EmployeeStatus.ONBOARDING],
        })
        .andWhere('e.jobseekerDeclaredCompleteAt IS NOT NULL')
        .andWhere('e.employerDeclaredCompleteAt IS NULL')
        .getCount(),
      this.employeeRepo
        .createQueryBuilder('e')
        .where('e.status = :ended', { ended: EmployeeStatus.ENDED })
        .andWhere('e.endDate >= :start AND e.endDate < :end', {
          start: startOfCurrentMonth,
          end: startOfNextMonth,
        })
        .getCount(),
    ]);

    const totalAgencyFees = Number(totalAgencyFeesRaw?.amount ?? 0);
    const feesThisMonth = Number(feesThisMonthRaw?.amount ?? 0);
    const feesLastMonth = Number(feesLastMonthRaw?.amount ?? 0);

    const vettedTrend = this.buildMonthlyTrend(
      vettedThisMonth,
      vettedLastMonth,
    );
    const jobsTrend = this.buildMonthlyTrend(jobsThisMonth, jobsLastMonth);
    const hiresTrend = this.buildMonthlyTrend(hiresThisMonth, hiresLastMonth);
    const agencyFeesTrend = this.buildMonthlyTrend(
      feesThisMonth,
      feesLastMonth,
    );

    return {
      stats: {
        totalVettedTalent: {
          value: totalVettedTalent,
          changePercent: vettedTrend.percent,
          changeValue: vettedTrend.value,
          period: 'month',
        },
        jobsPosted: {
          value: totalJobsPosted,
          changePercent: jobsTrend.percent,
          changeValue: jobsTrend.value,
          period: 'month',
        },
        successfulHires: {
          value: totalSuccessfulHires,
          changePercent: hiresTrend.percent,
          changeValue: hiresTrend.value,
          period: 'month',
        },
        totalAgencyFees: {
          value: Number.isFinite(totalAgencyFees) ? totalAgencyFees : 0,
          changePercent: agencyFeesTrend.percent,
          changeValue: Number.isFinite(agencyFeesTrend.value)
            ? agencyFeesTrend.value
            : 0,
          period: 'month',
        },
        mutualCompletion: {
          pendingOneSided: employmentsPendingMutualCompletion,
          awaitingJobseekerConfirmation: completionAwaitingJobseeker,
          awaitingEmployerConfirmation: completionAwaitingEmployer,
          endedThisMonth: employmentsEndedMutualThisMonth,
        },
      },
      pendingApprovals: {
        employerVerification: {
          total: pendingEmployerVerificationsTotal,
          items: pendingEmployerVerifications.map((item) => ({
            id: item.id,
            employerId: item.employerId,
            companyName:
              item.companyName ||
              `${item.employer?.firstName ?? ''} ${item.employer?.lastName ?? ''}`.trim() ||
              'Unspecified company',
            contactName:
              `${item.employer?.firstName ?? ''} ${item.employer?.lastName ?? ''}`.trim(),
            email: item.employer?.email,
            submittedAt: item.createdAt,
          })),
        },
        jobseekerApproval: {
          total: pendingJobseekerApprovalsTotal,
          items: pendingJobseekerApprovals.map((item) => ({
            id: item.id,
            fullName: `${item.firstName} ${item.lastName}`.trim(),
            email: item.email,
            title: item.jobTitle,
            submittedAt: item.updatedAt,
          })),
        },
      },
      recentJobPosts: {
        total: totalJobsPosted,
        items: recentJobPostsRaw.map((j) => ({
          id: j.id,
          title: j.title,
          status: j.status,
          employerId: j.employerId,
          companyName:
            j.employer?.verification?.companyName?.trim() ||
            `${j.employer?.firstName ?? ''} ${j.employer?.lastName ?? ''}`.trim() ||
            j.employer?.email ||
            'Employer',
          createdAt: j.createdAt,
        })),
      },
    };
  }

  /**
   * Update employer status (ACTIVE, INACTIVE, SUSPENDED)
   */
  async updateEmployerStatus(
    adminId: string,
    employerId: string,
    status: EmployerStatus,
    reason?: string,
  ): Promise<{ success: boolean; employerId: string; status: EmployerStatus }> {
    const employerProfile = await this.profileRepo.findOne({
      where: { id: employerId },
      relations: ['verification', 'auth'],
    });

    if (!employerProfile) {
      throw new NotFoundException('Employer not found');
    }

    // Validate: Can only activate if verification is APPROVED
    if (status === EmployerStatus.ACTIVE) {
      if (
        !employerProfile.verification ||
        employerProfile.verification.status !== VerificationStatus.APPROVED
      ) {
        throw new BadRequestException(
          'Cannot activate employer: Verification must be APPROVED first',
        );
      }
    }

    // Update status
    employerProfile.status = status;
    if (status === EmployerStatus.SUSPENDED) {
      employerProfile.auth.suspensionReason = reason || null;
    } else {
      employerProfile.auth.suspensionReason = null;
    }

    await this.profileRepo.save(employerProfile);

    // Send notification email
    const email = employerProfile.auth?.email || employerProfile.email;
    if (email) {
      let subject = '';
      let message = '';

      switch (status) {
        case EmployerStatus.ACTIVE:
          subject = 'Account Activated';
          message =
            'Your account has been activated. You can now post jobs and manage applications.';
          break;
        case EmployerStatus.INACTIVE:
          subject = 'Account Deactivated';
          message =
            'Your account has been deactivated. Please contact support if you have questions.';
          break;
        case EmployerStatus.SUSPENDED:
          subject = 'Account Suspended';
          message = reason
            ? `Your account has been suspended. Reason: ${reason}`
            : 'Your account has been suspended. Please contact support for assistance.';
          break;
      }

      await this.notificationService.sendEmail({
        to: email,
        subject,
        template: 'general-notification',
        context: {
          firstName: employerProfile.firstName || 'Employer',
          message,
          actionText: 'Contact Support',
          actionUrl: process.env.SUPPORT_URL || 'https://jobstack.ng/support',
        },
      });
    }

    return { success: true, employerId, status };
  }

  /**
   * Suspend an employer account (deprecated - use updateEmployerStatus instead)
   */
  async suspendEmployer(
    adminId: string,
    employerId: string,
    reason?: string,
  ): Promise<{ success: boolean; employerId: string }> {
    await this.updateEmployerStatus(
      adminId,
      employerId,
      EmployerStatus.SUSPENDED,
      reason,
    );
    return { success: true, employerId };
  }

  /**
   * Unsuspend an employer account (deprecated - use updateEmployerStatus instead)
   */
  async unsuspendEmployer(
    adminId: string,
    employerId: string,
  ): Promise<{ success: boolean; employerId: string }> {
    const employerAuth = await this.employerAuthRepo.findOne({
      where: { id: employerId },
      relations: ['profile'],
    });

    if (!employerAuth) {
      throw new NotFoundException('Employer not found');
    }

    if (!employerAuth.suspended) {
      throw new BadRequestException('Employer is not suspended');
    }

    employerAuth.suspended = false;
    employerAuth.suspendedAt = null;
    employerAuth.suspensionReason = null;

    await this.employerAuthRepo.save(employerAuth);

    // Send notification email
    if (employerAuth.profile) {
      await this.notificationService.sendEmail({
        to: employerAuth.email,
        subject: 'Account Reinstated',
        template: 'general-notification',
        context: {
          firstName: employerAuth.profile.firstName || 'Employer',
          message:
            'Your account has been reinstated. You can now log in and use all features.',
          actionText: 'Login to Dashboard',
          actionUrl:
            process.env.EMPLOYER_DASHBOARD_URL ||
            'https://jobstack.ng/employer/login',
        },
      });
    }

    return { success: true, employerId };
  }

  /**
   * Suspend a jobseeker account
   */
  async suspendJobseeker(
    adminId: string,
    jobseekerId: string,
    reason?: string,
  ): Promise<{ success: boolean; jobseekerId: string }> {
    const jobseekerAuth = await this.jobseekerAuthRepo.findOne({
      where: { id: jobseekerId },
      relations: ['profile'],
    });

    if (!jobseekerAuth) {
      throw new NotFoundException('Jobseeker not found');
    }

    if (jobseekerAuth.suspended) {
      throw new BadRequestException('Jobseeker is already suspended');
    }

    jobseekerAuth.suspended = true;
    jobseekerAuth.suspendedAt = new Date();
    jobseekerAuth.suspensionReason = reason || null;

    await this.jobseekerAuthRepo.save(jobseekerAuth);

    // Send notification email
    if (jobseekerAuth.profile) {
      await this.notificationService.sendEmail({
        to: jobseekerAuth.email,
        subject: 'Account Suspension Notice',
        template: 'general-notification',
        context: {
          firstName: jobseekerAuth.profile.firstName || 'Jobseeker',
          message: reason
            ? `Your account has been suspended. Reason: ${reason}`
            : 'Your account has been suspended. Please contact support for assistance.',
          actionText: 'Contact Support',
          actionUrl: process.env.SUPPORT_URL || 'https://jobstack.ng/support',
        },
      });
    }

    return { success: true, jobseekerId };
  }

  /**
   * Unsuspend a jobseeker account
   */
  async unsuspendJobseeker(
    adminId: string,
    jobseekerId: string,
  ): Promise<{ success: boolean; jobseekerId: string }> {
    const jobseekerAuth = await this.jobseekerAuthRepo.findOne({
      where: { id: jobseekerId },
      relations: ['profile'],
    });

    if (!jobseekerAuth) {
      throw new NotFoundException('Jobseeker not found');
    }

    if (!jobseekerAuth.suspended) {
      throw new BadRequestException('Jobseeker is not suspended');
    }

    jobseekerAuth.suspended = false;
    jobseekerAuth.suspendedAt = null;
    jobseekerAuth.suspensionReason = null;

    await this.jobseekerAuthRepo.save(jobseekerAuth);

    // Send notification email
    if (jobseekerAuth.profile) {
      await this.notificationService.sendEmail({
        to: jobseekerAuth.email,
        subject: 'Account Reinstated',
        template: 'general-notification',
        context: {
          firstName: jobseekerAuth.profile.firstName || 'Jobseeker',
          message:
            'Your account has been reinstated. You can now log in and use all features.',
          actionText: 'Login to Dashboard',
          actionUrl:
            process.env.JOBSEEKER_DASHBOARD_URL ||
            'https://jobstack.ng/jobseeker/login',
        },
      });
    }

    return { success: true, jobseekerId };
  }

  async verifyJobseekerIdDocument(
    adminId: string,
    jobseekerId: string,
    verified: boolean,
  ) {
    const profile = await this.jobseekerProfileRepo.findOne({
      where: { id: jobseekerId },
    });

    if (!profile) {
      throw new NotFoundException('Jobseeker profile not found');
    }

    if (!profile.idDocumentId) {
      throw new BadRequestException(
        'Jobseeker has not uploaded an ID document',
      );
    }

    profile.idDocumentVerified = Boolean(verified);
    profile.idDocumentVerifiedAt = verified ? new Date() : undefined;
    profile.idDocumentVerifiedByAdminId = verified ? adminId : undefined;

    await this.jobseekerProfileRepo.save(profile);

    return {
      success: true,
      jobseekerId,
      verified: profile.idDocumentVerified,
    };
  }

  async updateJobseekerVerification(
    adminId: string,
    jobseekerId: string,
    status: ApprovalStatus,
    reason?: string,
  ) {
    const profile = await this.jobseekerProfileRepo.findOne({
      where: { id: jobseekerId },
    });
    if (!profile) throw new NotFoundException('Jobseeker profile not found');

    if (status === ApprovalStatus.APPROVED) {
      if (!profile.idDocumentId || !profile.idDocumentVerified) {
        throw new BadRequestException(
          'Cannot approve jobseeker until ID document is verified',
        );
      }

      profile.approvalStatus = ApprovalStatus.APPROVED;
      profile.approvalRejectionReason = undefined;
      profile.approvalReviewedAt = new Date();
      profile.approvalReviewedByAdminId = adminId;

      await this.jobseekerProfileRepo.save(profile);
      return { success: true, jobseekerId, status: profile.approvalStatus };
    }

    if (status === ApprovalStatus.REJECTED) {
      const rejectionReason = (reason ?? '').trim();
      if (!rejectionReason) {
        throw new BadRequestException('Rejection reason is required');
      }

      profile.approvalStatus = ApprovalStatus.REJECTED;
      profile.approvalRejectionReason = rejectionReason;
      profile.approvalReviewedAt = new Date();
      profile.approvalReviewedByAdminId = adminId;

      await this.jobseekerProfileRepo.save(profile);
      return { success: true, jobseekerId, status: profile.approvalStatus };
    }

    profile.approvalStatus = status;
    profile.approvalRejectionReason = undefined;
    profile.approvalReviewedAt = new Date();
    profile.approvalReviewedByAdminId = adminId;
    await this.jobseekerProfileRepo.save(profile);
    return { success: true, jobseekerId, status: profile.approvalStatus };
  }

  /**
   * Suspend an admin account (only SUPER_ADMIN can do this)
   */
  async suspendAdmin(
    requesterId: string,
    targetAdminId: string,
    reason?: string,
  ): Promise<{ success: boolean; adminId: string }> {
    if (requesterId === targetAdminId) {
      throw new BadRequestException('Cannot suspend yourself');
    }

    const requester = await this.adminAuthRepo.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester admin not found');
    }

    // Only SUPER_ADMIN can suspend other admins
    if (requester.roleKey !== AdminRole.SUPER_ADMIN.role) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can suspend admin accounts',
      );
    }

    const target = await this.adminAuthRepo.findOne({
      where: { id: targetAdminId },
      relations: ['profile'],
    });

    if (!target) {
      throw new NotFoundException('Target admin not found');
    }

    if (target.suspended) {
      throw new BadRequestException('Admin is already suspended');
    }

    target.suspended = true;
    target.suspendedAt = new Date();
    target.suspensionReason = reason || null;

    await this.adminAuthRepo.save(target);

    return { success: true, adminId: target.id };
  }

  /**
   * Unsuspend an admin account (only SUPER_ADMIN can do this)
   */
  async unsuspendAdmin(
    requesterId: string,
    targetAdminId: string,
  ): Promise<{ success: boolean; adminId: string }> {
    const requester = await this.adminAuthRepo.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester admin not found');
    }

    // Only SUPER_ADMIN can unsuspend other admins
    if (requester.roleKey !== AdminRole.SUPER_ADMIN.role) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can unsuspend admin accounts',
      );
    }

    const target = await this.adminAuthRepo.findOne({
      where: { id: targetAdminId },
    });

    if (!target) {
      throw new NotFoundException('Target admin not found');
    }

    if (!target.suspended) {
      throw new BadRequestException('Admin is not suspended');
    }

    target.suspended = false;
    target.suspendedAt = null;
    target.suspensionReason = null;

    await this.adminAuthRepo.save(target);

    return { success: true, adminId: target.id };
  }

  /**
   * Delete an admin account (only SUPER_ADMIN can do this, and cannot delete themselves)
   */
  async deleteAdmin(requesterId: string, targetAdminId: string) {
    if (requesterId === targetAdminId) {
      throw new BadRequestException('Cannot delete yourself');
    }

    const requester = await this.adminAuthRepo.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester admin not found');
    }

    // Only SUPER_ADMIN can delete other admins
    if (requester.roleKey !== AdminRole.SUPER_ADMIN.role) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can delete admin accounts',
      );
    }

    const target = await this.adminAuthRepo.findOne({
      where: { id: targetAdminId },
    });

    if (!target) {
      throw new NotFoundException('Target admin not found');
    }

    await this.adminAuthRepo.remove(target);
    return { success: true };
  }
}
