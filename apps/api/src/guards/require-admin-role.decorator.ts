export const ADMIN_REQUIRED_ROLE = 'admin_required_role';

export function RequireAdminRole(roleKey: string) {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    Reflect.defineMetadata(
      ADMIN_REQUIRED_ROLE,
      roleKey,
      descriptor?.value ?? target,
    );
  };
}
