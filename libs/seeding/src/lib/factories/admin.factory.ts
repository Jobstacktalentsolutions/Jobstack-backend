import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';
import { AdminProfile } from '@app/common/database/entities/AdminProfile.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { ADMINS_DATA } from '../data/admins.data';

/**
 * Admin factory for seeding admins (auth + profile)
 */
export class AdminFactory extends BaseFactory<AdminAuth> {
  private profileRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'AdminAuth'), {
      defaultAttributes: () => ({ emailVerified: true }),
    });
    this.profileRepository = getRepositoryByName(dataSource, 'AdminProfile');
  }

  async createOrUpdateAdmin(data: any): Promise<AdminAuth> {
    const {
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      address,
      roleKey,
      privilegeLevel,
      ...rest
    } = data;

    // Upsert AdminAuth by id or email
    const auth = await this.smartUpsert(
      {
        id: data.id,
        email: data.email.toLowerCase(),
        password: passwordHash,
        emailVerified: true,
        roleKey,
        privilegeLevel,
      } as any,
      ['email'],
    );

    // Upsert AdminProfile linked to auth
    const profileRepo = this.profileRepository as ReturnType<
      typeof getRepositoryByName
    >;
    const existingProfile = await profileRepo.findOne({
      where: { authId: auth.id },
    });
    const profileData: Partial<AdminProfile> = {
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phoneNumber,
      address,
      authId: auth.id,
    };
    if (existingProfile) {
      await profileRepo.update({ id: existingProfile.id }, profileData);
    } else {
      await profileRepo.save(profileRepo.create(profileData));
    }

    return auth as any;
  }

  async createAll(): Promise<AdminAuth[]> {
    console.log('🔄 Upserting admin auth/profile records...');

    const admins: AdminAuth[] = [];
    for (const adminData of ADMINS_DATA) {
      try {
        const admin = await this.createOrUpdateAdmin(adminData);
        admins.push(admin);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert admin: ${adminData.email}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${admins.length} admin records`);
    return admins;
  }
}
