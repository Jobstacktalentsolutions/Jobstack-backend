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
  EmployerVerificationDocument,
  EmployerProfile,
  EmployerAuth,
  Job,
  JobseekerAuth,
  JobSeekerProfile,
  JobseekerVerificationDocument,
  Payment,
} from '@app/common/database/entities';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import { VerificationDocumentStatus } from '@app/common/shared/enums/verification-document-status.enum';
import { JobseekerVerificationDocumentKind } from '@app/common/shared/enums/jobseeker-docs.enum';
import {
  ApprovalStatus,
  EmployeeStatus,
  EmployerStatus,
  PaymentStatus,
} from '@app/common/database/entities/schema.enum';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { GetAllAdminsQueryDto } from './dto/get-all-admins-query.dto';
import { UpdateDocumentVerificationDto } from '../employer/dto/admin-verification.dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { ApprovalDecisionEmailService } from '../../approval-decision-email.service';

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
    @InjectRepository(EmployerVerificationDocument)
    private readonly employerVerificationDocRepo: Repository<EmployerVerificationDocument>,
    @InjectRepository(EmployerProfile)
    private readonly profileRepo: Repository<EmployerProfile>,
    @InjectRepository(EmployerAuth)
    private readonly employerAuthRepo: Repository<EmployerAuth>,
    @InjectRepository(JobseekerAuth)
    private readonly jobseekerAuthRepo: Repository<JobseekerAuth>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerProfileRepo: Repository<JobSeekerProfile>,
    @InjectRepository(JobseekerVerificationDocument)
    private readonly jobseekerVerificationDocRepo: Repository<JobseekerVerificationDocument>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly notificationService: NotificationService,
    private readonly approvalDecisionEmailService: ApprovalDecisionEmailService,
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
    adminId?: string,
  ) {
    const employerProfile = await this.profileRepo.findOne({
      where: { id: employerId },
      relations: ['auth'],
    });
    if (!employerProfile)
      throw new NotFoundException('Employer verification not found');

    const previousStatus = employerProfile.verificationStatus;
    employerProfile.verificationStatus = status;
    employerProfile.reviewedAt = new Date();
    employerProfile.reviewedByAdminId = adminId;
    employerProfile.verificationRejectionReason =
      status === VerificationStatus.REJECTED ? rejectionReason : undefined;
    await this.profileRepo.save(employerProfile);

    if (status === VerificationStatus.APPROVED) {
      const docs = await this.employerVerificationDocRepo.find({
        where: { employerProfileId: employerId },
      });
      const now = new Date();
      for (const d of docs) {
        d.status = VerificationDocumentStatus.APPROVED;
        d.rejectionReason = undefined;
        d.reviewedAt = now;
        d.reviewedByAdminId = adminId;
      }
      if (docs.length > 0) {
        await this.employerVerificationDocRepo.save(docs);
      }
    }

    if (employerProfile) {
      this.approvalDecisionEmailService.queueEmployerVerificationEmail(
        employerProfile,
        previousStatus,
        status,
        rejectionReason,
      );
    }

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
      this.profileRepo.find({
        where: { verificationStatus: VerificationStatus.PENDING },
        order: { updatedAt: 'DESC' },
        take: pendingLimit,
      }),
      this.profileRepo.count({
        where: { verificationStatus: VerificationStatus.PENDING },
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
        relations: ['employer'],
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
            employerId: item.id,
            companyName:
              item.companyName ||
              `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() ||
              'Unspecified company',
            contactName:
              `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
            email: item.email,
            submittedAt: item.updatedAt,
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
            j.employer?.companyName?.trim() ||
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
      relations: ['auth'],
    });

    if (!employerProfile) {
      throw new NotFoundException('Employer not found');
    }

    const previousVerificationStatus = employerProfile.verificationStatus;

    if (status === EmployerStatus.ACTIVE) {
      // Automatically approve verification and all documents on activation
      employerProfile.verificationStatus = VerificationStatus.APPROVED;
      employerProfile.reviewedAt = new Date();
      employerProfile.reviewedByAdminId = adminId;
      employerProfile.verificationRejectionReason = undefined;

      const docs = await this.employerVerificationDocRepo.find({
        where: { employerProfileId: employerId },
      });
      const now = new Date();
      for (const d of docs) {
        d.status = VerificationDocumentStatus.APPROVED;
        d.rejectionReason = undefined;
        d.reviewedAt = now;
        d.reviewedByAdminId = adminId;
      }
      if (docs.length > 0) {
        await this.employerVerificationDocRepo.save(docs);
      }

      if (previousVerificationStatus !== VerificationStatus.APPROVED) {
        this.approvalDecisionEmailService.queueEmployerVerificationEmail(
          employerProfile,
          previousVerificationStatus,
          VerificationStatus.APPROVED,
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

  // Sets status on a single jobseeker verification document (e.g. ID).
  async updateJobseekerVerificationDocument(
    adminId: string,
    jobseekerId: string,
    verificationDocumentId: string,
    dto: UpdateDocumentVerificationDto,
  ) {
    const row = await this.jobseekerVerificationDocRepo.findOne({
      where: {
        id: verificationDocumentId,
        jobseekerProfileId: jobseekerId,
      },
      relations: ['jobseekerProfile'],
    });

    if (!row) {
      throw new NotFoundException('Verification document not found');
    }

    const previousStatus = row.status;
    row.status = dto.status;
    row.rejectionReason =
      dto.status === VerificationDocumentStatus.REJECTED
        ? (dto.rejectionReason ?? '').trim() || undefined
        : undefined;
    row.reviewedAt = new Date();
    row.reviewedByAdminId = adminId;
    await this.jobseekerVerificationDocRepo.save(row);

    if (
      dto.status === VerificationDocumentStatus.REJECTED &&
      row.rejectionReason &&
      previousStatus !== VerificationDocumentStatus.REJECTED
    ) {
      const profile = row.jobseekerProfile;
      this.approvalDecisionEmailService.queueJobseekerVerificationDocumentRejectedEmail(
        profile,
        row.documentKind,
        row.rejectionReason,
      );
    }

    return {
      success: true,
      jobseekerId,
      documentId: row.id,
      status: row.status,
    };
  }

  // Marks all jobseeker verification rows approved (used when profile is approved).
  private async approveAllJobseekerVerificationDocuments(
    jobseekerProfileId: string,
    adminId: string,
  ): Promise<void> {
    const docs = await this.jobseekerVerificationDocRepo.find({
      where: { jobseekerProfileId },
    });
    const now = new Date();
    for (const d of docs) {
      d.status = VerificationDocumentStatus.APPROVED;
      d.rejectionReason = undefined;
      d.reviewedAt = now;
      d.reviewedByAdminId = adminId;
    }
    if (docs.length > 0) {
      await this.jobseekerVerificationDocRepo.save(docs);
    }
  }

  // Resets per-document review metadata when unapproving a jobseeker profile.
  private async resetJobseekerVerificationDocumentsToPending(
    jobseekerProfileId: string,
  ): Promise<void> {
    const docs = await this.jobseekerVerificationDocRepo.find({
      where: { jobseekerProfileId },
    });
    for (const d of docs) {
      d.status = VerificationDocumentStatus.PENDING;
      d.rejectionReason = undefined;
      d.reviewedAt = undefined;
      d.reviewedByAdminId = undefined;
    }
    if (docs.length > 0) {
      await this.jobseekerVerificationDocRepo.save(docs);
    }
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

    const previousApprovalStatus = profile.approvalStatus;

    if (status === ApprovalStatus.APPROVED) {
      const idRow = await this.jobseekerVerificationDocRepo.findOne({
        where: {
          jobseekerProfileId: jobseekerId,
          documentKind: JobseekerVerificationDocumentKind.ID_DOCUMENT,
        },
      });
      if (!idRow) {
        throw new BadRequestException(
          'Cannot approve jobseeker until an ID document is uploaded',
        );
      }
      const proofOfAddressRow = await this.jobseekerVerificationDocRepo.findOne(
        {
          where: {
            jobseekerProfileId: jobseekerId,
            documentKind: JobseekerVerificationDocumentKind.PROOF_OF_ADDRESS,
          },
        },
      );
      if (!proofOfAddressRow) {
        throw new BadRequestException(
          'Cannot approve jobseeker until proof of address is uploaded',
        );
      }
      if (
        !Array.isArray(profile.referenceContacts) ||
        profile.referenceContacts.length !== 2
      ) {
        throw new BadRequestException(
          'Cannot approve jobseeker until two reference contacts are provided',
        );
      }
      if (!profile.dateOfBirth) {
        throw new BadRequestException(
          'Cannot approve jobseeker until date of birth is provided',
        );
      }
      if (!profile.gender) {
        throw new BadRequestException(
          'Cannot approve jobseeker until gender is provided',
        );
      }

      profile.approvalStatus = ApprovalStatus.APPROVED;
      profile.approvalRejectionReason = undefined;
      profile.approvalReviewedAt = new Date();
      profile.approvalReviewedByAdminId = adminId;

      await this.jobseekerProfileRepo.save(profile);
      await this.approveAllJobseekerVerificationDocuments(jobseekerId, adminId);

      this.approvalDecisionEmailService.queueJobseekerApprovalEmail(
        profile,
        previousApprovalStatus,
        ApprovalStatus.APPROVED,
      );
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
      this.approvalDecisionEmailService.queueJobseekerApprovalEmail(
        profile,
        previousApprovalStatus,
        ApprovalStatus.REJECTED,
        rejectionReason,
      );
      return { success: true, jobseekerId, status: profile.approvalStatus };
    }

    profile.approvalStatus = status;
    profile.approvalRejectionReason = undefined;
    profile.approvalReviewedAt = new Date();
    profile.approvalReviewedByAdminId = adminId;
    await this.jobseekerProfileRepo.save(profile);

    if (
      status === ApprovalStatus.PENDING &&
      previousApprovalStatus === ApprovalStatus.APPROVED
    ) {
      await this.resetJobseekerVerificationDocumentsToPending(jobseekerId);
    }

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
