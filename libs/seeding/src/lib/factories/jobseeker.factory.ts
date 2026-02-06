import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerSkill } from '@app/common/database/entities/JobseekerSkill.entity';
import { JOBSEEKERS_DATA } from '../data/jobseekers.data';

export class JobseekerFactory extends BaseFactory<JobseekerAuth> {
  private profileRepository: any;
  private jobseekerSkillRepository: any;
  private skillRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'JobseekerAuth'), {
      defaultAttributes: () => ({ emailVerified: true }),
    });
    this.profileRepository = getRepositoryByName(
      dataSource,
      'JobSeekerProfile',
    );
    this.jobseekerSkillRepository = getRepositoryByName(
      dataSource,
      'JobseekerSkill',
    );
    this.skillRepository = getRepositoryByName(dataSource, 'Skill');
  }

  async createOrUpdateJobseeker(data: any): Promise<JobseekerAuth> {
    const {
      passwordHash,
      firstName,
      lastName,
      phoneNumber,
      address,
      skills,
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

    const profileData: Partial<JobSeekerProfile> = {
      id: auth.id,
      firstName,
      lastName,
      email: data.email.toLowerCase(),
      phoneNumber,
      address,
      state: data.state,
      city: data.city,
      jobTitle: data.jobTitle,
      brief: data.brief,
      yearsOfExperience: data.yearsOfExperience,
      preferredLocation: data.preferredLocation,
      preferredEmploymentType: data.preferredEmploymentType,
      preferredWorkMode: data.preferredWorkMode,
      preferredEmploymentArrangement: data.preferredEmploymentArrangement,
      minExpectedSalary: data.minExpectedSalary,
      maxExpectedSalary: data.maxExpectedSalary,
      approvalStatus: data.approvalStatus,
    };

    if (existingProfile) {
      await profileRepo.update({ id: existingProfile.id }, profileData);
    } else {
      await profileRepo.save(profileRepo.create(profileData));
    }

    // Handle skills
    if (skills && Array.isArray(skills)) {
      // Remove existing skills for this profile
      await this.jobseekerSkillRepository.delete({ profileId: auth.id });

      // Add new skills
      for (const skillData of skills) {
        try {
          // Check if skill exists
          const skill = await this.skillRepository.findOne({
            where: { id: skillData.skillId },
          });
          if (skill) {
            const jobseekerSkill = this.jobseekerSkillRepository.create({
              profileId: auth.id,
              skillId: skillData.skillId,
              proficiency: skillData.proficiency,
              yearsExperience: skillData.yearsExperience,
              verified: false,
            });
            await this.jobseekerSkillRepository.save(jobseekerSkill);
          }
        } catch (error: any) {
          console.warn(
            `⚠️  Failed to add skill ${skillData.skillId} to profile ${auth.id}:`,
            error.message,
          );
        }
      }
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
        console.warn(
          `⚠️  Failed to upsert jobseeker: ${jsData.email}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${jobseekers.length} jobseeker records`);
    return jobseekers;
  }
}
