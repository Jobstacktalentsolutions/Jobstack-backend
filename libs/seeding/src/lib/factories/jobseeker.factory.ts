import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JOBSEEKERS_DATA } from '../data/jobseekers.data';

export class JobseekerFactory extends BaseFactory<JobseekerAuth> {
  private profileRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'JobseekerAuth'), {
      defaultAttributes: () => ({ emailVerified: true }),
    });
    this.profileRepository = getRepositoryByName(
      dataSource,
      'JobSeekerProfile',
    );
  }

  async createOrUpdateJobseeker(data: any): Promise<JobseekerAuth> {
    const { passwordHash, firstName, lastName, phoneNumber, address, ...rest } = data;

    const auth = await this.smartUpsert(
      {
        id: data.id,
        email: data.email.toLowerCase(),
        password: passwordHash,
        emailVerified: true,
      } as any,
      ['email'],
    );

    const profileRepo = this.profileRepository as ReturnType<typeof getRepositoryByName>;

    const existingProfile = await profileRepo.findOne({ where: { id: auth.id } });

    const profileData: Partial<JobSeekerProfile> = {
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

  async createAll(): Promise<JobseekerAuth[]> {
    console.log('🔄 Upserting jobseeker auth/profile records...');

    const jobseekers: JobseekerAuth[] = [];
    for (const jsData of JOBSEEKERS_DATA) {
      try {
        const js = await this.createOrUpdateJobseeker(jsData);
        jobseekers.push(js);
      } catch (error: any) {
        console.warn(`⚠️  Failed to upsert jobseeker: ${jsData.email}`, error.message);
      }
    }

    console.log(`✅ Upserted ${jobseekers.length} jobseeker records`);
    return jobseekers;
  }
}
