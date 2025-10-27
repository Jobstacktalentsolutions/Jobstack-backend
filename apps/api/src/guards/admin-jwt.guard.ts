import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AccessTokenPayload } from '@app/common/shared/interfaces/jwt-payload.interface';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { RedisService } from '@app/common/redis/redis.service';
import { REDIS_KEYS } from '@app/common/redis/redis.config';
import { AdminAuthService } from 'apps/api/src/modules/auth/submodules/admin/admin-auth.service';
import { DataSource } from 'typeorm';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminRole } from '@app/common/shared/enums/roles.enum';

export const ADMIN_REQUIRED_ROLE = 'admin_required_role';

@Injectable()
export class AdminJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private adminAuthService: AdminAuthService,
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

      // Validate token type and role
      if (payload.type !== 'access' || payload.role !== UserRole.ADMIN) {
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
      const sessionValidation = await this.adminAuthService.validateSession(
        payload.sessionId,
      );

      if (!sessionValidation.valid) {
        throw new UnauthorizedException('Session expired or invalid');
      }

      // Attach user data to request for downstream use
      request.user = payload;

      // Optional role requirement check
      const requiredRoleKey = this.reflector.getAllAndOverride<
        string | undefined
      >(ADMIN_REQUIRED_ROLE, [context.getHandler(), context.getClass()]);

      if (requiredRoleKey) {
        const adminRepo = this.dataSource.getRepository(AdminAuth);
        const admin = await adminRepo.findOne({ where: { id: payload.sub } });
        if (!admin) {
          throw new UnauthorizedException('Admin not found');
        }

        const target = (AdminRole as Record<string, { privilegeLevel: number; role: string }>)[requiredRoleKey];
        if (!target) {
          throw new ForbiddenException('Invalid role requirement');
        }

        const hasRole = admin.roleKey === requiredRoleKey;
        const hasHigherPrivilege = admin.privilegeLevel > target.privilegeLevel;
        if (!hasRole && !hasHigherPrivilege) {
          throw new ForbiddenException('Insufficient role or privilege');
        }
      }

      return true;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
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
