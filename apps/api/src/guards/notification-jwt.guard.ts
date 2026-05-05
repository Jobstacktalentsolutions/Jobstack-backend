import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import type { Request } from 'express';
import { AccessTokenPayload } from '@app/common/shared/interfaces/jwt-payload.interface';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { JobSeekerAuthService } from 'apps/api/src/modules/auth/submodules/jobseeker/jobseeker-auth.service';
import { EmployerAuthService } from 'apps/api/src/modules/auth/submodules/employer/employer-auth.service';
import { AdminAuthService } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.service';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';

@Injectable()
export class NotificationJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly jobseekerAuthService: JobSeekerAuthService,
    private readonly employerAuthService: EmployerAuthService,
    private readonly adminAuthService: AdminAuthService,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getClass().name !== 'NotificationController') {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AccessTokenPayload }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token');
      }

      const isBlacklisted = await this.redisService.exists(
        REDIS_KEYS.ACCESS_TOKEN_BLACKLIST(payload.jti),
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      switch (payload.role) {
        case UserRole.JOB_SEEKER:
          await this.ensureJobSeekerSession(payload);
          break;
        case UserRole.EMPLOYER:
          await this.ensureEmployerSession(payload);
          break;
        case UserRole.ADMIN:
          await this.ensureAdminSession(payload);
          break;
        default:
          throw new UnauthorizedException('Invalid token');
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private async ensureJobSeekerSession(payload: AccessTokenPayload) {
    const sessionValidation = await this.jobseekerAuthService.validateSession(
      payload.sessionId,
    );
    if (!sessionValidation.valid) {
      throw new UnauthorizedException(
        'You are not authenticated or authorized this page',
      );
    }

    if (sessionValidation.userId) {
      const repo = this.dataSource.getRepository(JobseekerAuth);
      const auth = await repo.findOne({
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
  }

  private async ensureEmployerSession(payload: AccessTokenPayload) {
    const sessionValidation = await this.employerAuthService.validateSession(
      payload.sessionId,
    );
    if (!sessionValidation.valid) {
      throw new UnauthorizedException(
        'You are not authenticated or authorized this page',
      );
    }

    if (sessionValidation.userId) {
      const repo = this.dataSource.getRepository(EmployerAuth);
      const auth = await repo.findOne({
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
  }

  private async ensureAdminSession(payload: AccessTokenPayload) {
    const sessionValidation = await this.adminAuthService.validateSession(
      payload.sessionId,
    );
    if (!sessionValidation.valid) {
      throw new UnauthorizedException(
        'You are not authenticated or authorized this page',
      );
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
