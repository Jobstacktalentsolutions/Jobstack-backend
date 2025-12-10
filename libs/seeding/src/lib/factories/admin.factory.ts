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
  private profileRepository: ReturnType<typeof getRepositoryByName<AdminProfile>>;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'AdminAuth'), {
      defaultAttributes: () => ({ hasChangedPassword: true }),
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
        hasChangedPassword: true, // Seeded admins have specific passwords, not default
        roleKey,
        privilegeLevel,
      } as any,
      ['email'],
    );

    // Upsert AdminProfile linked to auth
    const profileRepo = this.profileRepository as ReturnType<
      typeof getRepositoryByName
    >;
    // Find by primary id or nested relation (backward compatible with older schema assumptions)
    const existingProfile = await profileRepo.findOne({
      where: [
        { id: auth.id } as any,
        { auth: { id: auth.id } } as any,
      ],
      relations: ['auth'],
    });
    const profileData: Partial<AdminProfile> = {
      id: auth.id,
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phoneNumber,
      address,
      
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
