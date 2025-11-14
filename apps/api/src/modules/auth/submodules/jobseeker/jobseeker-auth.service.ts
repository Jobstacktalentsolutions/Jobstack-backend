import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { ApprovalStatus } from '@app/common/database/entities/schema.enum';
import { JobseekerSession } from '@app/common/database/entities/JobseekerSession.entity';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { NotificationService } from '../../../notification/notification.service';
import { UserRole } from 'libs/common/src/shared/enums/user-roles.enum';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  RedisSessionData,
  PasswordResetTokenPayload,
} from 'libs/common/src/shared/interfaces/jwt-payload.interface';
import {
  AuthResult,
  EmailVerificationResult,
  PasswordResetRequestResult,
  PasswordResetConfirmationResult,
} from 'apps/api/src/modules/auth/interfaces/auth.interface';
import {
  JobSeekerRegistrationDto,
  LoginDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
} from './dto/jobseeker-auth.dto';
import { SkillsService } from '../../../skills/skills.service';
import { EmailTemplateType } from 'apps/api/src/modules/notification/email/email-notification.enum';
@Injectable()
export class JobSeekerAuthService {
  private readonly logger = new Logger(JobSeekerAuthService.name);

  constructor(
    @InjectRepository(JobseekerAuth)
    private jobseekerAuthRepository: Repository<JobseekerAuth>,
    @InjectRepository(JobSeekerProfile)
    private jobseekerProfileRepository: Repository<JobSeekerProfile>,
    @InjectRepository(JobseekerSession)
    private jobseekerSessionRepository: Repository<JobseekerSession>,
    private jwtService: JwtService,
    private redisService: RedisService,
    private notificationService: NotificationService,
    private dataSource: DataSource,
    private skillsService: SkillsService,
  ) {}

  /**
   * Register a new job seeker
   */
  async register(
    registrationData: JobSeekerRegistrationDto,
    deviceInfo?: any,
  ): Promise<AuthResult> {
    const { email, password, firstName, lastName, phoneNumber } =
      registrationData;

    // Check if email already exists
    const existingAuth = await this.jobseekerAuthRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingAuth) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone number already exists
    const existingProfile = await this.jobseekerProfileRepository.findOne({
      where: { phoneNumber },
    });

    if (existingProfile) {
      throw new ConflictException('Phone number already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Use transaction to create auth and profile
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create auth first
      const auth = queryRunner.manager.create(JobseekerAuth, {
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      await queryRunner.manager.save(auth);

      // Create profile with same ID as auth
      const profile = queryRunner.manager.create(JobSeekerProfile, {
        id: auth.id,
        email: email.toLowerCase(),
        firstName,
        lastName,
        phoneNumber,
        approvalStatus: ApprovalStatus.PENDING,
      });
      await queryRunner.manager.save(profile);

      await queryRunner.commitTransaction();

      // Send verification email
      await this.sendVerificationEmail(email.toLowerCase());

      // Send welcome email
      await this.notificationService.sendEmail({
        to: email.toLowerCase(),
        subject: 'Welcome to JobStack',
        template: EmailTemplateType.WELCOME,
        context: {
          firstName,
          userType: UserRole.JOB_SEEKER,
        },
      });

      // Generate tokens
      const authResult = await this.generateTokens(auth, profile, deviceInfo);

      this.logger.log(`JobSeeker registered: ${auth.id} (${email})`);

      return authResult;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Registration failed: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Login job seeker
   */
  async login(loginData: LoginDto, deviceInfo?: any): Promise<AuthResult> {
    const { email, password } = loginData;

    // Find auth by email
    const auth = await this.jobseekerAuthRepository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['profile'],
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, auth.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!auth.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // Generate tokens
    const authResult = await this.generateTokens(
      auth,
      auth.profile,
      deviceInfo,
    );

    this.logger.log(`JobSeeker logged in: ${auth.id} (${email})`);

    return authResult;
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    refreshToken: string,
    deviceInfo?: any,
  ): Promise<AuthResult> {
    try {
      // Verify refresh token
      const payload =
        await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.exists(
        REDIS_KEYS.REFRESH_TOKEN_BLACKLIST(payload.jti),
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Validate session
      const session = await this.jobseekerSessionRepository.findOne({
        where: {
          id: payload.sessionId,
          isActive: true,
        },
      });

      if (!session || session.isExpired()) {
        throw new UnauthorizedException('Session expired');
      }

      // Find auth and profile
      const auth = await this.jobseekerAuthRepository.findOne({
        where: { id: payload.id },
        relations: ['profile'],
      });

      if (!auth) {
        throw new UnauthorizedException('User not found');
      }

      // Update session activity
      session.lastActivityAt = new Date();
      await this.jobseekerSessionRepository.save(session);

      // Generate new access token (keep same refresh token)
      const accessTokenId = uuidv4();
      const accessPayload: AccessTokenPayload = {
        id: auth.id,
        role: UserRole.JOB_SEEKER,
        profileId: auth.profile.id,
        sessionId: session.id,
        type: 'access',
        jti: accessTokenId,
        iat: Math.floor(Date.now() / 1000),
      };

      const accessToken = await this.jwtService.signAsync(accessPayload, {
        expiresIn: '2d',
      });

      // Update Redis session
      const redisSessionData: RedisSessionData = {
        userId: auth.id,
        role: UserRole.JOB_SEEKER,
        profileId: auth.profile.id,
        sessionId: session.id,
        deviceFingerprint: this.generateDeviceFingerprint(deviceInfo),
        lastActivity: Date.now(),
      };
      await this.storeRedisSession(session.id, redisSessionData);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 2);

      this.logger.log(`Token refreshed for job seeker: ${auth.id}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: auth.id,
          email: auth.email,
          role: UserRole.JOB_SEEKER,
          profileId: auth.profile.id,
          firstName: auth.profile?.firstName,
          lastName: auth.profile?.lastName,
        },
        expiresAt,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout - revoke tokens and invalidate session
   */
  async logout(
    sessionId: string,
    accessTokenId: string,
    refreshTokenId: string,
  ): Promise<void> {
    try {
      // Blacklist tokens
      await Promise.all([
        this.redisService.setex(
          REDIS_KEYS.ACCESS_TOKEN_BLACKLIST(accessTokenId),
          REDIS_KEYS.ACCESS_TOKEN_TTL,
          'revoked',
        ),
        this.redisService.setex(
          REDIS_KEYS.REFRESH_TOKEN_BLACKLIST(refreshTokenId),
          REDIS_KEYS.REFRESH_TOKEN_TTL,
          'revoked',
        ),
      ]);

      // Remove Redis session
      await this.removeRedisSession(sessionId);

      // Deactivate database session
      await this.jobseekerSessionRepository.update(sessionId, {
        isActive: false,
        lastActivityAt: new Date(),
      });

      this.logger.log(`JobSeeker logged out: session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Send email verification code
   */
  async sendVerificationEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // If account does not exist, return generic success to prevent enumeration
      const auth = await this.jobseekerAuthRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (!auth) {
        return {
          sent: true,
          message:
            "If an account exists with this email, we've sent a verification email. Check your inbox or spam.",
        };
      }

      // Check cooldown
      const codeKey = REDIS_KEYS.EMAIL_VERIFICATION_CODE(normalizedEmail);
      const existingCode = await this.redisService.get(codeKey);

      if (existingCode) {
        const ttl = await this.redisService.ttl(codeKey);
        if (ttl > 540) {
          return {
            sent: false,
            waitTime: ttl - 540,
            message:
              'Verification code was recently sent. Please wait before requesting another.',
          };
        }
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code
      await this.redisService.setex(codeKey, REDIS_KEYS.VERIFICATION_TTL, code);

      // Send email
      await this.notificationService.sendEmail({
        to: normalizedEmail,
        subject: 'Email Verification - JobStack',
        template: EmailTemplateType.EMAIL_VERIFICATION,
        context: {
          code,
          expiryMinutes: 10,
        },
      });

      this.logger.log(`Verification email sent to: ${email}`);

      return {
        sent: true,
        message: 'Verification code sent to your email.',
      };
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify email with code and return auth tokens
   */
  async verifyEmail(
    email: string,
    code: string,
    deviceInfo?: any,
  ): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const codeKey = REDIS_KEYS.EMAIL_VERIFICATION_CODE(normalizedEmail);
    const storedCode = await this.redisService.get(codeKey);

    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    // Mark email as verified and load profile
    const auth = await this.jobseekerAuthRepository.findOne({
      where: { email: normalizedEmail },
      relations: ['profile'],
    });

    if (!auth) {
      throw new NotFoundException('User not found');
    }

    // Update emailVerified field
    auth.emailVerified = true;
    await this.jobseekerAuthRepository.save(auth);

    // Clean up code
    await this.redisService.del(codeKey);

    // Generate and return tokens
    const authResult = await this.generateTokens(
      auth,
      auth.profile,
      deviceInfo,
    );

    this.logger.log(`Email verified: ${normalizedEmail}`);

    return authResult;
  }

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(
    requestData: PasswordResetRequestDto,
  ): Promise<PasswordResetRequestResult> {
    const { email } = requestData;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // Find user
      console.log('Email to reset password ', normalizedEmail);
      const auth = await this.jobseekerAuthRepository.findOne({
        where: { email: normalizedEmail },
      });

      if (!auth) {
        throw new BadRequestException('No account found with this email');
      }

      // Check cooldown
      const codeKey = REDIS_KEYS.PASSWORD_RESET_CODE(auth.id);
      const existingCode = await this.redisService.get(codeKey);

      if (existingCode) {
        const ttl = await this.redisService.ttl(codeKey);
        if (ttl > 840) {
          return {
            sent: false,
            waitTime: ttl - 840,
            message:
              'Reset code was recently sent. Please wait before requesting another.',
          };
        }
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store code
      await this.redisService.setex(
        codeKey,
        REDIS_KEYS.PASSWORD_RESET_TTL,
        code,
      );

      // Send email
      await this.notificationService.sendEmail({
        to: normalizedEmail,
        subject: 'Password Reset - JobStack',
        template: EmailTemplateType.PASSWORD_RESET,
        context: {
          code,
          expiryMinutes: 15,
        },
      });

      this.logger.log(`Password reset code sent to: ${email}`);

      return {
        sent: true,
        message:
          "If an account exists with this email, we've sent a reset code. Check your inbox or spam.",
      };
    } catch (error) {
      this.logger.error(`Failed to send password reset code: ${error.message}`);
      throw error;
    }
  }

  /**
   * Confirm password reset code
   */
  async confirmPasswordResetCode(
    confirmData: PasswordResetConfirmCodeDto,
  ): Promise<PasswordResetConfirmationResult> {
    const { email, code } = confirmData;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const auth = await this.jobseekerAuthRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid reset code');
    }

    // Verify code
    const codeKey = REDIS_KEYS.PASSWORD_RESET_CODE(auth.id);
    const storedCode = await this.redisService.get(codeKey);

    if (!storedCode || storedCode !== code) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    // Generate reset token
    const tokenPayload: PasswordResetTokenPayload = {
      userId: auth.id,
      type: 'password_reset',
      iat: Math.floor(Date.now() / 1000),
    };

    const resetToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: '15m',
    });

    // Clean up code
    await this.redisService.del(codeKey);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    this.logger.log(`Password reset code confirmed for: ${normalizedEmail}`);

    return { resetToken, expiresAt };
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    resetData: PasswordResetDto,
  ): Promise<{ success: boolean }> {
    const { resetToken, newPassword } = resetData;
    try {
      this.logger.log(
        `Attempting to verify reset token for password reset`,
        newPassword,
      );

      // Verify token
      const payload =
        await this.jwtService.verifyAsync<PasswordResetTokenPayload>(
          resetToken,
        );

      this.logger.log(
        `Reset token verified successfully for userId: ${payload.userId}`,
      );

      if (payload.type !== 'password_reset') {
        this.logger.warn(
          `Invalid token type: ${payload.type}, expected: password_reset`,
        );
        throw new UnauthorizedException('Invalid reset token');
      }

      this.logger.log(
        `Token type validation passed for userId: ${payload.userId}`,
      );

      // Find user
      const auth = await this.jobseekerAuthRepository.findOne({
        where: { id: payload.userId },
      });

      if (!auth) {
        this.logger.warn(`User not found for userId: ${payload.userId}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User found for password reset: ${auth.email}`);

      // Hash new password
      this.logger.log(`Hashing new password for user: ${auth.email}`);
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      this.logger.log(`Updating password in database for user: ${auth.email}`);
      auth.password = hashedPassword;
      await this.jobseekerAuthRepository.save(auth);

      // Invalidate all sessions
      this.logger.log(`Invalidating all sessions for user: ${auth.email}`);
      await this.jobseekerSessionRepository.update(
        { jobseeker: { id: auth.id } },
        { isActive: false },
      );

      this.logger.log(`Password reset successful for: ${auth.email}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired reset token');
    }
  }

  /**
   * Validate session
   */
  async validateSession(
    sessionId: string,
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      // Check Redis session
      const sessionData = await this.getRedisSession(sessionId);
      if (!sessionData) {
        return { valid: false };
      }

      // Check database session
      const dbSession = await this.jobseekerSessionRepository.findOne({
        where: { id: sessionId, isActive: true },
      });

      if (!dbSession || dbSession.isExpired()) {
        await this.removeRedisSession(sessionId);
        return { valid: false };
      }

      return { valid: true, userId: sessionData.userId };
    } catch (error) {
      this.logger.warn(`Session validation failed: ${error.message}`);
      return { valid: false };
    }
  }

  /**
   * Generate authentication tokens
   */
  private async generateTokens(
    auth: JobseekerAuth,
    profile: JobSeekerProfile,
    deviceInfo?: any,
  ): Promise<AuthResult> {
    // Create session
    const session = this.jobseekerSessionRepository.create({
      jobseeker: auth,
      ipAddress: deviceInfo?.ip || null,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
      lastActivityAt: new Date(),
    });
    await this.jobseekerSessionRepository.save(session);

    // Generate token IDs
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    // Create access token payload
    const accessPayload: AccessTokenPayload = {
      id: auth.id,
      role: UserRole.JOB_SEEKER,
      profileId: profile.id,
      sessionId: session.id,
      type: 'access',
      jti: accessTokenId,
      iat: Math.floor(Date.now() / 1000),
    };

    // Create refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      id: auth.id,
      role: UserRole.JOB_SEEKER,
      profileId: profile.id,
      sessionId: session.id,
      type: 'refresh',
      jti: refreshTokenId,
      iat: Math.floor(Date.now() / 1000),
    };

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '2d' }),
      this.jwtService.signAsync(refreshPayload, { expiresIn: '7d' }),
    ]);

    // Store Redis session
    const redisSessionData: RedisSessionData = {
      userId: auth.id,
      role: UserRole.JOB_SEEKER,
      profileId: profile.id,
      sessionId: session.id,
      deviceFingerprint: this.generateDeviceFingerprint(deviceInfo),
      lastActivity: Date.now(),
    };
    await this.storeRedisSession(session.id, redisSessionData);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2);

    return {
      accessToken,
      refreshToken,
      user: {
        id: auth.id,
        email: auth.email,
        role: UserRole.JOB_SEEKER,
        profileId: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
      expiresAt,
      sessionId: session.id,
    };
  }

  private generateDeviceFingerprint(deviceInfo?: any): string {
    if (!deviceInfo) return 'unknown';
    const { userAgent, platform, language } = deviceInfo;
    return `${userAgent}-${platform}-${language}`.substring(0, 100);
  }

  private async storeRedisSession(
    sessionId: string,
    sessionData: RedisSessionData,
  ): Promise<void> {
    const key = REDIS_KEYS.USER_SESSION(sessionId);
    await this.redisService.setex(
      key,
      REDIS_KEYS.SESSION_TTL,
      JSON.stringify(sessionData),
    );
  }

  private async getRedisSession(
    sessionId: string,
  ): Promise<RedisSessionData | null> {
    try {
      const key = REDIS_KEYS.USER_SESSION(sessionId);
      const data = await this.redisService.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  private async removeRedisSession(sessionId: string): Promise<void> {
    const key = REDIS_KEYS.USER_SESSION(sessionId);
    await this.redisService.del(key);
  }
}
