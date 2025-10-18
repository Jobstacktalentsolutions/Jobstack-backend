import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { AdminProfile } from '@app/common/database/entities/AdminProfile.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { ADMINS_DATA } from '../data/admins.data';
import { RoleFactory } from './role.factory';

/**
 * Admin factory for seeding admin profiles
 */
export class AdminFactory extends BaseFactory<AdminProfile> {
  private roleFactory: RoleFactory;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'AdminProfile'), {
      defaultAttributes: () => ({}),
    });
    this.roleFactory = new RoleFactory(dataSource);
  }

  /**
   * Smart upsert for admin by email (unique field)
   */
  async smartUpsertAdmin(data: any): Promise<AdminProfile> {
    // Filter out fields that don't exist in AdminProfile entity
    const { passwordHash, ...adminData } = data;

    const uniqueFields = ['email'];
    return await this.smartUpsert(adminData, uniqueFields);
  }

  /**
   * Check if super admin already exists
   */
  async superAdminExists(): Promise<boolean> {
    const superAdminData = ADMINS_DATA[0]; // First admin is always super admin
    const existingAdmin = await this.repository.findOne({
      where: [{ id: superAdminData.id }, { email: superAdminData.email }],
    });
    return !!existingAdmin;
  }

  /**
   * Create all admins from static data using smart upsert
   */
  async createAll(): Promise<AdminProfile[]> {
    console.log('🔄 Upserting admin profile records...');

    // Create roles first
    await this.roleFactory.createAll();

    const admins = [];
    for (const adminData of ADMINS_DATA) {
      try {
        const admin = await this.smartUpsertAdmin(adminData);
        admins.push(admin);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert admin: ${adminData.email}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${admins.length} admin profile records`);
    return admins;
  }
}
