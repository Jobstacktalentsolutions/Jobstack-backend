import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { Permission } from '@app/common/database/entities/Permission.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { SYSTEM_PERMISSIONS } from '../data/permissions.data';

/**
 * Permission factory for seeding permissions
 */
export class PermissionFactory extends BaseFactory<Permission> {
  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'Permission'), {
      defaultAttributes: () => ({}),
    });
  }

  /**
   * Smart upsert for permission by key (unique field)
   */
  async smartUpsertPermission(data: any): Promise<Permission> {
    const uniqueFields = ['key'];
    return await this.smartUpsert(data, uniqueFields);
  }

  /**
   * Create all permissions from static data using smart upsert
   */
  async createAll(): Promise<Permission[]> {
    console.log('🔄 Upserting permission records...');

    const permissions = [];
    for (const permissionData of SYSTEM_PERMISSIONS) {
      try {
        const permission = await this.smartUpsertPermission(permissionData);
        permissions.push(permission);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert permission: ${permissionData.key}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${permissions.length} permission records`);
    return permissions;
  }
}
