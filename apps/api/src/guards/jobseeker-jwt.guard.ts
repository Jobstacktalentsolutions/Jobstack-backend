import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AccessTokenPayload } from '@app/common/shared/interfaces/jwt-payload.interface';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { JobSeekerAuthService } from '../modules/auth/submodules/jobseeker/jobseeker-auth.service';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';

@Injectable()
export class JobSeekerJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private jobseekerAuthService: JobSeekerAuthService,
    private redisService: RedisService,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      // Verify JWT token
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      console.log('payload', payload);
      // Validate token type and role
      if (payload.role !== UserRole.JOB_SEEKER) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.exists(
        REDIS_KEYS.ACCESS_TOKEN_BLACKLIST(payload.jti),
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Validate session
      const sessionValidation = await this.jobseekerAuthService.validateSession(
        payload.sessionId,
      );

      if (!sessionValidation.valid) {
        throw new UnauthorizedException('Session expired or invalid');
      }

      // Check if account is suspended
      if (sessionValidation.userId) {
        const jobseekerAuthRepo = this.dataSource.getRepository(JobseekerAuth);
        const auth = await jobseekerAuthRepo.findOne({
          where: { id: sessionValidation.userId },
        });

        if (auth?.suspended) {
          throw new UnauthorizedException(
            auth.suspensionReason
              ? `Your account has been suspended. Reason: ${auth.suspensionReason}`
              : 'Your account has been suspended. Please contact support for assistance.',
          );
        }
      }

      // Attach user data to request
      request.user = payload;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
