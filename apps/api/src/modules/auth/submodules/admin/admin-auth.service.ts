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
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminSession } from '@app/common/database/entities/AdminSession.entity';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  RedisSessionData,
  PasswordResetTokenPayload,
  DefaultPasswordChangeTokenPayload,
} from '@app/common/shared/interfaces/jwt-payload.interface';
import {
  AuthResult,
  PasswordResetRequestResult,
  PasswordResetConfirmationResult,
} from 'apps/api/src/modules/auth/interfaces/auth.interface';
import {
  LoginDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
  AdminDefaultPasswordChangeDto,
  AdminDefaultPasswordChangeRequestDto,
} from './dto/admin-auth.dto';

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    @InjectRepository(AdminAuth)
    private adminAuthRepository: Repository<AdminAuth>,
    @InjectRepository(AdminSession)
    private adminSessionRepository: Repository<AdminSession>,
    private jwtService: JwtService,
    private redisService: RedisService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Login admin
   */
  async login(loginData: LoginDto, deviceInfo?: any): Promise<AuthResult> {
    const { email, password } = loginData;

    // Find auth by email
    const auth = await this.adminAuthRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, auth.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if password has been changed from default
    if (!auth.hasChangedPassword) {
      throw new UnauthorizedException(
        'Please change your default password before logging in',
      );
    }

    // Generate tokens
    const authResult = await this.generateTokens(auth, deviceInfo);

    this.logger.log(`Admin logged in: ${auth.id} (${email})`);

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
      const session = await this.adminSessionRepository.findOne({
        where: {
          id: payload.sessionId,
          isActive: true,
        },
      });

      if (!session || session.isExpired()) {
        throw new UnauthorizedException('Session expired');
      }

      // Find auth
      const auth = await this.adminAuthRepository.findOne({
        where: { id: payload.id },
      });

      if (!auth) {
        throw new UnauthorizedException('User not found');
      }

      // Update session activity
      session.lastActivityAt = new Date();
      await this.adminSessionRepository.save(session);

      // Generate new access token (keep same refresh token)
      const accessTokenId = uuidv4();
      const accessPayload: AccessTokenPayload = {
        id: auth.id,
        role: UserRole.ADMIN,
        sessionId: session.id,
        type: 'access',
        jti: accessTokenId,
        iat: Math.floor(Date.now() / 1000),
        // Note: Specific admin roleKey/privilegeLevel are checked server-side as needed
      };

      const accessToken = await this.jwtService.signAsync(accessPayload, {
        expiresIn: '7d',
      });

      // Update Redis session
      const redisSessionData: RedisSessionData = {
        userId: auth.id,
        role: UserRole.ADMIN,
        sessionId: session.id,
        deviceFingerprint: this.generateDeviceFingerprint(deviceInfo),
        lastActivity: Date.now(),
      };
      await this.storeRedisSession(session.id, redisSessionData);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      this.logger.log(`Token refreshed for admin: ${auth.id}`);

      return {
        accessToken,
        refreshToken,
        user: {
          id: auth.id,
          email: auth.email,
          role: UserRole.ADMIN,
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
      await this.adminSessionRepository.update(sessionId, {
        isActive: false,
        lastActivityAt: new Date(),
      });

      this.logger.log(`Admin logged out: session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Request a token for changing the default password.
   */
  async requestDefaultPasswordChange(
    requestData: AdminDefaultPasswordChangeRequestDto,
  ): Promise<PasswordResetConfirmationResult> {
    const { email, currentPassword } = requestData;
    const normalizedEmail = email.toLowerCase();

    const auth = await this.adminAuthRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!auth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (auth.hasChangedPassword) {
      throw new BadRequestException('Default password already changed');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      auth.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokenPayload: DefaultPasswordChangeTokenPayload = {
      userId: auth.id,
      type: 'default_password_change',
      iat: Math.floor(Date.now() / 1000),
    };

    const resetToken = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: '15m',
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    this.logger.log(
      `Default password change token issued for admin: ${auth.id}`,
    );

    return { resetToken, expiresAt };
  }

  /**
   * Complete the default password change flow using the issued token.
   */
  async completeDefaultPasswordChange(
    changeData: AdminDefaultPasswordChangeDto,
  ): Promise<{ success: boolean }> {
    let payload: DefaultPasswordChangeTokenPayload;
    try {
      payload =
        await this.jwtService.verifyAsync<DefaultPasswordChangeTokenPayload>(
          changeData.resetToken,
        );
    } catch (error) {
      this.logger.error(
        `Default password change verification failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
      throw new UnauthorizedException('Invalid or expired change token');
    }

    if (payload.type !== 'default_password_change') {
      throw new UnauthorizedException('Invalid change token');
    }

    const auth = await this.adminAuthRepository.findOne({
      where: { id: payload.userId },
    });

    if (!auth) {
      throw new NotFoundException('Admin not found');
    }

    if (auth.hasChangedPassword) {
      throw new BadRequestException('Default password already changed');
    }

    const hashedPassword = await bcrypt.hash(changeData.newPassword, 12);
    auth.password = hashedPassword;
    auth.hasChangedPassword = true;
    await this.adminAuthRepository.save(auth);

    await this.adminSessionRepository.update(
      { admin: { id: auth.id } },
      { isActive: false },
    );

    this.logger.log(`Default password changed for admin: ${auth.email}`);

    return { success: true };
  }

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(
    requestData: PasswordResetRequestDto,
  ): Promise<PasswordResetRequestResult> {
    const { email } = requestData;

    try {
      // Find user with profile for personalized email
      const auth = await this.adminAuthRepository.findOne({
        where: { email: email.toLowerCase() },
        relations: ['profile'],
      });

      if (!auth) {
        throw new BadRequestException('Invalid request');
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

      // Send email (firstName from profile when available; service defaults to 'there')
      await this.notificationService.sendEmail({
        to: email,
        subject: 'Password Reset - JobStack Admin',
        template: 'password-reset',
        context: {
          code,
          expiryMinutes: 15,
          firstName: auth.profile?.firstName,
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

    // Find user
    const auth = await this.adminAuthRepository.findOne({
      where: { email: email.toLowerCase() },
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

    this.logger.log(`Password reset code confirmed for: ${email}`);

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
      // Verify token
      const payload =
        await this.jwtService.verifyAsync<PasswordResetTokenPayload>(
          resetToken,
        );

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      // Find user
      const auth = await this.adminAuthRepository.findOne({
        where: { id: payload.userId },
      });

      if (!auth) {
        throw new NotFoundException('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and mark as changed
      auth.password = hashedPassword;
      auth.hasChangedPassword = true;
      await this.adminAuthRepository.save(auth);

      // Invalidate all sessions
      await this.adminSessionRepository.update(
        { admin: { id: auth.id } },
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
      const dbSession = await this.adminSessionRepository.findOne({
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
    auth: AdminAuth,
    deviceInfo?: any,
  ): Promise<AuthResult> {
    // Create session
    const session = this.adminSessionRepository.create({
      admin: auth,
      ipAddress: deviceInfo?.ip || null,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
      lastActivityAt: new Date(),
    });
    await this.adminSessionRepository.save(session);

    // Generate token IDs
    const accessTokenId = uuidv4();
    const refreshTokenId = uuidv4();

    // Create access token payload
    const accessPayload: AccessTokenPayload = {
      id: auth.id,
      role: UserRole.ADMIN,
      sessionId: session.id,
      type: 'access',
      jti: accessTokenId,
      iat: Math.floor(Date.now() / 1000),
    };

    // Create refresh token payload
    const refreshPayload: RefreshTokenPayload = {
      id: auth.id,
      role: UserRole.ADMIN,
      sessionId: session.id,
      type: 'refresh',
      jti: refreshTokenId,
      iat: Math.floor(Date.now() / 1000),
    };

    // Generate tokens
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, { expiresIn: '7d' }),
      this.jwtService.signAsync(refreshPayload, { expiresIn: '7d' }),
    ]);

    // Store Redis session
    const redisSessionData: RedisSessionData = {
      userId: auth.id,
      role: UserRole.ADMIN,
      sessionId: session.id,
      deviceFingerprint: this.generateDeviceFingerprint(deviceInfo),
      lastActivity: Date.now(),
    };
    await this.storeRedisSession(session.id, redisSessionData);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      accessToken,
      refreshToken,
      user: {
        id: auth.id,
        email: auth.email,
        role: UserRole.ADMIN,
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
