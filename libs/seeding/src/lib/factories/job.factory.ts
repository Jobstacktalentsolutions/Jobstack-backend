import { DataSource, In } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { Job } from '@app/common/database/entities/Job.entity';
import { Skill } from '@app/common/database/entities/Skill.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { JOBS_DATA } from '../data/jobs.data';
import { SkillFactory } from './skill.factory';
import { EmployerFactory } from './employer.factory';

export class JobFactory extends BaseFactory<Job> {
  private skillRepository: any;
  private employerRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'Job'), {
      defaultAttributes: () => ({}),
    });
    this.skillRepository = getRepositoryByName(dataSource, 'Skill');
    this.employerRepository = getRepositoryByName(
      dataSource,
      'EmployerProfile',
    );
  }

  // createAll upserts all static job seed records
  async createAll(): Promise<Job[]> {
    console.log('🔄 Upserting job records...');

    // Ensure dependencies (skills, employers) are in place before jobs
    const skillFactory = new SkillFactory(this.dataSource);
    await skillFactory.createAll();

    const employerFactory = new EmployerFactory(this.dataSource);
    await employerFactory.createAll();

    const jobs: Job[] = [];
    for (const jobData of JOBS_DATA) {
      try {
        // Resolve skills and employer
        const skillIds = jobData.skills;
        const skills_entities = await this.skillRepository.findBy({
          id: In(skillIds),
        });

        const employer = await this.employerRepository.findOne({
          where: { id: jobData.employerId },
        });

        if (!employer) {
          console.warn(
            `⚠️  Skipping job ${jobData.id} because employer ${jobData.employerId} is missing`,
          );
          continue;
        }

        if (!skills_entities || skills_entities.length !== skillIds.length) {
          console.warn(
            `⚠️  Skipping job ${jobData.id} because one or more skills are missing`,
          );
          continue;
        }

        // Ensure employer exists (it should, based on seeding order)
        // We set employer object directly if passing relation, but here we likely pass employerId column if defined,
        // however TypeORM prefers objects for relations or we need to be careful.
        // The Job entity has `employerId` column and `employer` relation.

        const { skills, ...jobProps } = jobData;

        // First upsert the job without many-to-many relations to avoid TypeORM update issues
        const job = await this.smartUpsert(
          {
            ...jobProps,
            employer,
          },
          ['id'],
        );

        // Then set skills relation explicitly
        job.skills = skills_entities;
        await this.repository.save(job);

        jobs.push(job);
      } catch (error) {
        console.warn(`⚠️  Failed to upsert job: ${jobData.id}`, error.message);
        console.error(error);
      }
    }

    console.log(`✅ Upserted ${jobs.length} job records`);
    return jobs;
  }
}
