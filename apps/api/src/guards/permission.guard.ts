import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '@app/common/shared/enums/permissions.enum';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { DataSource } from 'typeorm';

export const PERMISSIONS_METADATA_KEY = 'required_permissions';

export const PermissionsRequired =
  (...perms: Permissions[]) =>
  // store as metadata array
  (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(
      PERMISSIONS_METADATA_KEY,
      perms,
      descriptor?.value ?? target,
    );
  };

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permissions[]>(
      PERMISSIONS_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true; // no permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub: string } | undefined;
    if (!user?.sub) {
      throw new ForbiddenException('Missing authenticated admin context');
    }

    // Load admin with role and permissions
    const adminRepo = this.dataSource.getRepository(AdminAuth);
    const admin = await adminRepo.findOne({
      where: { id: user.sub },
      relations: ['profile', 'profile.role', 'profile.role.permissions'],
    });

    if (!admin?.profile?.role) {
      throw new ForbiddenException('Admin has no role assigned');
    }

    const adminPermissionKeys = new Set(
      (admin.profile.role.permissions ?? []).map((p) => p.key),
    );

    const hasAll = required.every((perm) => adminPermissionKeys.has(perm));
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
