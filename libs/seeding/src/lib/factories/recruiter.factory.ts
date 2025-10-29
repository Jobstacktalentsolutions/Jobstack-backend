import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { RECRUITERS_DATA } from '../data/recruiters.data';

export class RecruiterFactory extends BaseFactory<RecruiterAuth> {
  private profileRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'RecruiterAuth'), {
      defaultAttributes: () => ({ emailVerified: true }),
    });
    this.profileRepository = getRepositoryByName(
      dataSource,
      'RecruiterProfile',
    );
  }

  async createOrUpdateRecruiter(data: any): Promise<RecruiterAuth> {
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

    const profileData: Partial<RecruiterProfile> = {
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

  async createAll(): Promise<RecruiterAuth[]> {
    console.log('🔄 Upserting recruiter auth/profile records...');

    const recruiters: RecruiterAuth[] = [];
    for (const recData of RECRUITERS_DATA) {
      try {
        const rec = await this.createOrUpdateRecruiter(recData);
        recruiters.push(rec);
      } catch (error: any) {
        console.warn(`⚠️  Failed to upsert recruiter: ${recData.email}`, error.message);
      }
    }

    console.log(`✅ Upserted ${recruiters.length} recruiter records`);
    return recruiters;
  }
}
