import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import {
  RecruiterVerification,
  RecruiterProfile,
} from '@app/common/database/entities';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
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
    @InjectRepository(RecruiterVerification)
    private readonly verificationRepo: Repository<RecruiterVerification>,
    @InjectRepository(RecruiterProfile)
    private readonly profileRepo: Repository<RecruiterProfile>,
    private readonly notificationService: NotificationService,
  ) {}

  async getAdminProfile(userId: string): Promise<any> {
    const admin = await this.adminAuthRepo.findOne({ where: { id: userId } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return {
      id: admin.id,
      email: admin.email,
      roleKey: admin.roleKey,
      privilegeLevel: admin.privilegeLevel,
      managerId: admin.managerId || null,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
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
      emailVerified: true,
      roleKey,
      privilegeLevel: target.privilegeLevel,
      managerId: creator.id,
      profile: {
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        email: email.toLowerCase(),
        phoneNumber: phoneNumber || '',
        address: address || null,
      } as any,
    });

    const saved = await this.adminAuthRepo.save(auth);

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

  async deleteAdmin(requesterId: string, targetAdminId: string) {
    if (requesterId === targetAdminId) {
      throw new BadRequestException('Cannot delete yourself');
    }

    const [requester, target] = await Promise.all([
      this.adminAuthRepo.findOne({ where: { id: requesterId } }),
      this.adminAuthRepo.findOne({ where: { id: targetAdminId } }),
    ]);

    if (!target) throw new NotFoundException('Target admin not found');

    // Only higher privilege can delete lower
    if (requester!.privilegeLevel <= target.privilegeLevel) {
      throw new ForbiddenException('Insufficient privilege to delete admin');
    }

    await this.adminAuthRepo.remove(target);
    return { success: true };
  }

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

  async updateAdminProfile(userId: string, updateData: any): Promise<any> {
    const admin = await this.adminAuthRepo.findOne({ where: { id: userId } });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (updateData.email) {
      admin.email = updateData.email.toLowerCase();
    }

    await this.adminAuthRepo.save(admin);
    return this.getAdminProfile(userId);
  }

  async getAllAdmins(_userId: string): Promise<any[]> {
    const admins = await this.adminAuthRepo.find({
      select: [
        'id',
        'email',
        'roleKey',
        'privilegeLevel',
        'managerId',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
    });

    return admins.map((a) => ({
      id: a.id,
      email: a.email,
      roleKey: a.roleKey,
      privilegeLevel: a.privilegeLevel,
      managerId: a.managerId || null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
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
}
