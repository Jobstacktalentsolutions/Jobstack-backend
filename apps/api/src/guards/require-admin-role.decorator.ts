import { AdminRole } from '@app/common/shared/enums/roles.enum';

export const ADMIN_REQUIRED_ROLE = 'admin_required_role';

export function RequireAdminRole(role: string | string[]) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(
      ADMIN_REQUIRED_ROLE,
      role,
      descriptor?.value ?? target,
    );
  };
}
