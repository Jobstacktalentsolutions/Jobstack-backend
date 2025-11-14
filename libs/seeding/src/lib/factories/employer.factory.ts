import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { EMPLOYERS_DATA } from '../data/employers.data';

export class EmployerFactory extends BaseFactory<EmployerAuth> {
  private profileRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'EmployerAuth'), {
      defaultAttributes: () => ({ emailVerified: true }),
    });
    this.profileRepository = getRepositoryByName(dataSource, 'EmployerProfile');
  }

  async createOrUpdateEmployer(data: any): Promise<EmployerAuth> {
    const {
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      address,
      type,
      profilePictureId,
      ...rest
    } = data;

    const auth = await this.smartUpsert(
      {
        id: data.id,
        email: data.email.toLowerCase(),
        password: passwordHash,
        emailVerified: true,
      } as any,
      ['email'],
    );

    const profileRepo = this.profileRepository as ReturnType<
      typeof getRepositoryByName
    >;

    const existingProfile = await profileRepo.findOne({
      where: { id: auth.id },
    });

    const profileData: Partial<EmployerProfile> = {
      id: auth.id,
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phoneNumber,
      address,
      type,
      profilePictureId,
    };

    if (existingProfile) {
      await profileRepo.update({ id: existingProfile.id }, profileData);
    } else {
      await profileRepo.save(profileRepo.create(profileData));
    }

    return auth as any;
  }

  async createAll(): Promise<EmployerAuth[]> {
    console.log('🔄 Upserting employer auth/profile records...');

    const employers: EmployerAuth[] = [];
    for (const empData of EMPLOYERS_DATA) {
      try {
        const emp = await this.createOrUpdateEmployer(empData);
        employers.push(emp);
      } catch (error: any) {
        console.warn(
          `⚠️  Failed to upsert employer: ${empData.email}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${employers.length} employer records`);
    return employers;
  }
}
