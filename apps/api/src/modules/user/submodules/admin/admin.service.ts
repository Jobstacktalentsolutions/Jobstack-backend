import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import {
  RecruiterVerification,
  RecruiterProfile,
} from '@app/common/database/entities';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';
import { UserRole } from '@app/common/shared/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminAuth)
    private readonly adminAuthRepo: Repository<AdminAuth>,
    @InjectRepository(RecruiterVerification)
    private readonly verificationRepo: Repository<RecruiterVerification>,
    @InjectRepository(RecruiterProfile)
    private readonly profileRepo: Repository<RecruiterProfile>,
  ) {}

  /**
   * Get admin profile
   */
  async getAdminProfile(userId: string): Promise<any> {
    const admin = await this.adminAuthRepo.findOne({
      where: { id: userId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN, // Default to ADMIN role
      permissions: this.getAdminPermissions(UserRole.ADMIN),
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  /**
   * Approve/Reject recruiter verification
   */
  async updateRecruiterVerification(
    recruiterId: string,
    status: VerificationStatus,
    rejectionReason?: string,
  ) {
    const verification = await this.verificationRepo.findOne({
      where: { recruiterId },
      relations: ['documents', 'documents.document'],
    });
    if (!verification) throw new NotFoundException('Verification not found');

    verification.status = status;
    verification.reviewedAt = new Date();
    verification.rejectionReason =
      status === VerificationStatus.REJECTED ? rejectionReason : undefined;
    await this.verificationRepo.save(verification);

    return { recruiterId, status };
  }

  /**
   * Update admin profile
   */
  async updateAdminProfile(userId: string, updateData: any): Promise<any> {
    const admin = await this.adminAuthRepo.findOne({
      where: { id: userId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Update allowed fields
    if (updateData.email) {
      admin.email = updateData.email;
    }

    await this.adminAuthRepo.save(admin);
    return this.getAdminProfile(userId);
  }

  /**
   * Get all admins (super admin only)
   */
  async getAllAdmins(userId: string): Promise<any[]> {
    const currentAdmin = await this.adminAuthRepo.findOne({
      where: { id: userId },
    });

    // For now, allow all admins to view other admins
    // TODO: Implement proper super admin role checking

    const admins = await this.adminAuthRepo.find({
      select: ['id', 'email', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });

    return admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      role: UserRole.ADMIN,
      permissions: this.getAdminPermissions(UserRole.ADMIN),
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    }));
  }

  /**
   * Get admin permissions based on role
   */
  private getAdminPermissions(role: UserRole): string[] {
    const basePermissions = [
      'view_users',
      'view_notifications',
      'view_analytics',
    ];

    if (role === UserRole.ADMIN) {
      return [
        ...basePermissions,
        'manage_users',
        'manage_admins',
        'manage_system',
        'view_sensitive_data',
        'manage_settings',
        'manage_roles',
      ];
    }

    return basePermissions;
  }

  /**
   * Check if admin has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const admin = await this.getAdminProfile(userId);
    return admin.permissions.includes(permission);
  }

  /**
   * Get system overview (super admin only)
   */
  async getSystemOverview(userId: string): Promise<any> {
    const currentAdmin = await this.adminAuthRepo.findOne({
      where: { id: userId },
    });

    // For now, allow all admins to view system overview
    // TODO: Implement proper super admin role checking

    // TODO: Implement actual system metrics
    return {
      totalUsers: 0,
      totalJobSeekers: 0,
      totalRecruiters: 0,
      totalAdmins: 0,
      systemUptime: '99.9%',
      lastBackup: new Date().toISOString(),
      activeSessions: 0,
      storageUsed: '0 MB',
    };
  }
}
