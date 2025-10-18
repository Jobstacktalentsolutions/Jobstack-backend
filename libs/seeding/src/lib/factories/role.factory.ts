import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { Role } from '@app/common/database/entities/Role.entity';
import { Permission } from '@app/common/database/entities/Permission.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { SYSTEM_ROLES } from '../data/roles.data';
import { PermissionFactory } from './permission.factory';

/**
 * Role factory for seeding roles and role-permission relationships
 */
export class RoleFactory extends BaseFactory<Role> {
  private permissionFactory: PermissionFactory;
  private permissionRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'Role'), {
      defaultAttributes: () => ({}),
    });
    this.permissionFactory = new PermissionFactory(dataSource);
    this.permissionRepository = getRepositoryByName(dataSource, 'Permission');
  }

  /**
   * Smart upsert for role by name (unique field)
   */
  async smartUpsertRole(data: any): Promise<Role> {
    const uniqueFields = ['name'];
    return await this.smartUpsert(data, uniqueFields);
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(
    role: Role,
    permissionKeys: string[],
  ): Promise<void> {
    // Find permissions by keys
    const permissions = await this.permissionRepository.find({
      where: permissionKeys.map((key) => ({ key })),
    });

    if (permissions.length !== permissionKeys.length) {
      const foundKeys = permissions.map((p: Permission) => p.key);
      const missingKeys = permissionKeys.filter(
        (key) => !foundKeys.includes(key),
      );
      console.warn(
        `⚠️  Missing permissions for role ${role.name}:`,
        missingKeys,
      );
    }

    // Assign permissions to role using the junction table
    // Note: This assumes the relationship is properly set up in the entities
    role.permissions = permissions;
    await this.repository.save(role);
  }

  /**
   * Create all roles from static data using smart upsert
   */
  async createAll(): Promise<Role[]> {
    console.log('🔄 Upserting role records...');

    // Ensure permissions exist first
    await this.permissionFactory.createAll();

    const roles = [];
    for (const roleData of SYSTEM_ROLES) {
      try {
        // Extract permissions from role data
        const { permissions: permissionKeys, ...roleInfo } = roleData;

        // Create/update the role
        const role = await this.smartUpsertRole(roleInfo);

        // Assign permissions to the role
        if (permissionKeys && permissionKeys.length > 0) {
          await this.assignPermissionsToRole(role, permissionKeys);
        }

        roles.push(role);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert role: ${roleData.name}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${roles.length} role records`);
    return roles;
  }
}
