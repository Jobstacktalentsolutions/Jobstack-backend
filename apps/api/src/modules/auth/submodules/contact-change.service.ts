import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { NotificationService } from '../../../notification/notification.service';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import {
  ConfirmEmailChangeDto,
  ConfirmPhoneChangeDto,
  RequestEmailChangeDto,
  RequestPhoneChangeDto,
} from './contact-change.dto';

type Role = 'jobseeker' | 'recruiter';

// Shared contact change flow for jobseeker and recruiter
@Injectable()
export class ContactChangeService {
  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly dataSource: DataSource,
    @InjectRepository(JobseekerAuth)
    private readonly jobseekerAuthRepo: Repository<JobseekerAuth>,
    @InjectRepository(RecruiterAuth)
    private readonly recruiterAuthRepo: Repository<RecruiterAuth>,
    @InjectRepository(JobSeekerProfile)
    private readonly jobseekerProfileRepo: Repository<JobSeekerProfile>,
    @InjectRepository(RecruiterProfile)
    private readonly recruiterProfileRepo: Repository<RecruiterProfile>,
  ) {}

  // Send SMS to current phone to approve email change
  async requestEmailChange(
    role: Role,
    userId: string,
    dto: RequestEmailChangeDto,
  ): Promise<void> {
    const { currentEmail, currentPhone } = await this.getCurrentContacts(
      role,
      userId,
    );

    // Prevent duplicate email
    const exists = await this.findAuthByEmail(role, dto.newEmail.toLowerCase());
    if (exists) throw new ConflictException('Email already in use');

    const code = this.generateCode();
    await this.redisService.setex(
      REDIS_KEYS.PENDING_EMAIL_CHANGE(userId),
      REDIS_KEYS.VERIFICATION_TTL,
      dto.newEmail.toLowerCase(),
    );
    await this.redisService.setex(
      REDIS_KEYS.EMAIL_CHANGE_CODE(userId),
      REDIS_KEYS.VERIFICATION_TTL,
      code,
    );

    // Send SMS to current phone
    await this.notificationService.sendSMS({
      to: currentPhone,
      body: `JobStack: Confirm your email change to ${dto.newEmail}. Code: ${code} (expires in 10 mins)`,
    });
  }

  // Confirm email change with SMS code
  async confirmEmailChange(
    role: Role,
    userId: string,
    dto: ConfirmEmailChangeDto,
  ): Promise<void> {
    const pending = await this.redisService.get(
      REDIS_KEYS.PENDING_EMAIL_CHANGE(userId),
    );
    const code = await this.redisService.get(
      REDIS_KEYS.EMAIL_CHANGE_CODE(userId),
    );
    if (!pending || !code)
      throw new NotFoundException('No pending email change');
    if (pending.toLowerCase() !== dto.newEmail.toLowerCase())
      throw new ConflictException('Mismatched email');
    if (code !== dto.code) throw new ConflictException('Invalid code');

    await this.applyEmailChange(role, userId, dto.newEmail.toLowerCase());

    await this.redisService.del(REDIS_KEYS.PENDING_EMAIL_CHANGE(userId));
    await this.redisService.del(REDIS_KEYS.EMAIL_CHANGE_CODE(userId));
  }

  // Send Email to current email to approve phone change
  async requestPhoneChange(
    role: Role,
    userId: string,
    dto: RequestPhoneChangeDto,
  ): Promise<void> {
    const { currentEmail } = await this.getCurrentContacts(role, userId);

    // Prevent duplicate phone across the same role (and ideally globally)
    const exists = await this.findProfileByPhone(role, dto.newPhoneNumber);
    if (exists) throw new ConflictException('Phone number already in use');

    const code = this.generateCode();
    await this.redisService.setex(
      REDIS_KEYS.PENDING_PHONE_CHANGE(userId),
      REDIS_KEYS.VERIFICATION_TTL,
      dto.newPhoneNumber,
    );
    await this.redisService.setex(
      REDIS_KEYS.PHONE_CHANGE_CODE(userId),
      REDIS_KEYS.VERIFICATION_TTL,
      code,
    );

    await this.notificationService.sendEmail({
      to: currentEmail,
      subject: 'Confirm your phone number change',
      template: 'generic-code',
      context: {
        code,
        title: 'Phone Number Change',
        message: `Confirm change to ${dto.newPhoneNumber}`,
        expiryMinutes: 10,
      },
    });
  }

  // Confirm phone change with email code
  async confirmPhoneChange(
    role: Role,
    userId: string,
    dto: ConfirmPhoneChangeDto,
  ): Promise<void> {
    const pending = await this.redisService.get(
      REDIS_KEYS.PENDING_PHONE_CHANGE(userId),
    );
    const code = await this.redisService.get(
      REDIS_KEYS.PHONE_CHANGE_CODE(userId),
    );
    if (!pending || !code)
      throw new NotFoundException('No pending phone change');
    if (pending !== dto.newPhoneNumber)
      throw new ConflictException('Mismatched phone number');
    if (code !== dto.code) throw new ConflictException('Invalid code');

    await this.applyPhoneChange(role, userId, dto.newPhoneNumber);

    await this.redisService.del(REDIS_KEYS.PENDING_PHONE_CHANGE(userId));
    await this.redisService.del(REDIS_KEYS.PHONE_CHANGE_CODE(userId));
  }

  private async getCurrentContacts(
    role: Role,
    userId: string,
  ): Promise<{ currentEmail: string; currentPhone: string }> {
    if (role === 'jobseeker') {
      const auth = await this.jobseekerAuthRepo.findOne({
        where: { id: userId },
        relations: ['profile'],
      });
      if (!auth || !auth.profile) throw new NotFoundException('User not found');
      return {
        currentEmail: auth.email,
        currentPhone: auth.profile.phoneNumber,
      };
    }
    const auth = await this.recruiterAuthRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile) throw new NotFoundException('User not found');
    return { currentEmail: auth.email, currentPhone: auth.profile.phoneNumber };
  }

  private async findAuthByEmail(role: Role, email: string) {
    if (role === 'jobseeker')
      return this.jobseekerAuthRepo.findOne({ where: { email } });
    return this.recruiterAuthRepo.findOne({ where: { email } });
  }

  private async findProfileByPhone(role: Role, phone: string) {
    if (role === 'jobseeker')
      return this.jobseekerProfileRepo.findOne({
        where: { phoneNumber: phone },
      });
    return this.recruiterProfileRepo.findOne({ where: { phoneNumber: phone } });
  }

  private async applyEmailChange(
    role: Role,
    userId: string,
    newEmail: string,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (role === 'jobseeker') {
        const auth = await queryRunner.manager.findOne(JobseekerAuth, {
          where: { id: userId },
          relations: ['profile'],
        });
        if (!auth || !auth.profile)
          throw new NotFoundException('User not found');
        auth.email = newEmail;
        auth.profile.email = newEmail;
        await queryRunner.manager.save([auth, auth.profile]);
      } else {
        const auth = await queryRunner.manager.findOne(RecruiterAuth, {
          where: { id: userId },
          relations: ['profile'],
        });
        if (!auth || !auth.profile)
          throw new NotFoundException('User not found');
        auth.email = newEmail;
        auth.profile.email = newEmail;
        await queryRunner.manager.save([auth, auth.profile]);
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  private async applyPhoneChange(
    role: Role,
    userId: string,
    newPhone: string,
  ): Promise<void> {
    const repo =
      role === 'jobseeker'
        ? this.jobseekerProfileRepo
        : this.recruiterProfileRepo;
    const authRepo =
      role === 'jobseeker' ? this.jobseekerAuthRepo : this.recruiterAuthRepo;
    const auth = await authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile) throw new NotFoundException('User not found');
    auth.profile.phoneNumber = newPhone;
    await repo.save(auth.profile);
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
