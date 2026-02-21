import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { JobApplication } from '@app/common/database/entities/JobApplication.entity';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';
import { JOBSEEKERS_DATA } from '../data/jobseekers.data';

const JOB_APPLICATIONS_DATA: Array<{
  jobId: string;
  jobseekerProfileId: string;
  status: JobApplicationStatus;
  expectedSalary?: number;
  note?: string;
  createdAt: Date;
}> = require('../data/job-applications.data').JOB_APPLICATIONS_DATA;

export class JobApplicationFactory extends BaseFactory<JobApplication> {
  private jobRepository: any;
  private jobseekerProfileRepository: any;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'JobApplication'), {
      defaultAttributes: () => ({
        status: JobApplicationStatus.APPLIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });
    this.jobRepository = getRepositoryByName(dataSource, 'Job');
    this.jobseekerProfileRepository = getRepositoryByName(
      dataSource,
      'JobSeekerProfile',
    );
  }

  /** Resolve profile id from seed id or by email when DB profile has a different id (e.g. after upsert by email). */
  private async resolveProfileId(seedProfileId: string): Promise<string | null> {
    const byId = await this.jobseekerProfileRepository.findOne({
      where: { id: seedProfileId },
    });
    if (byId) return byId.id;
    const seedJobseeker = JOBSEEKERS_DATA.find((js: any) => js.id === seedProfileId);
    if (!seedJobseeker?.email) return null;
    const byEmail = await this.jobseekerProfileRepository.findOne({
      where: { email: (seedJobseeker.email as string).toLowerCase() },
    });
    return byEmail?.id ?? null;
  }

  /**
   * Create or update a job application
   */
  async createOrUpdateJobApplication(data: any): Promise<JobApplication> {
    // Check if job exists
    const job = await this.jobRepository.findOne({ where: { id: data.jobId } });
    if (!job) {
      throw new Error(`Job with ID ${data.jobId} not found`);
    }

    // Resolve jobseeker profile id (seed id or actual DB id when profile was upserted by email)
    const profileId = await this.resolveProfileId(data.jobseekerProfileId);
    if (!profileId) {
      throw new Error(
        `JobSeeker profile with ID ${data.jobseekerProfileId} not found`,
      );
    }

    // Check if application already exists (prevent duplicates)
    const existingApplication = await this.repository.findOne({
      where: {
        jobId: data.jobId,
        jobseekerProfileId: profileId,
      },
    });

    const payload = {
      ...data,
      jobseekerProfileId: profileId,
      updatedAt: new Date(),
    };

    if (existingApplication) {
      // Update existing application
      await this.repository.update(
        { id: existingApplication.id },
        payload,
      );
      return (await this.repository.findOne({
        where: { id: existingApplication.id },
      })) as JobApplication;
    } else {
      // Create new application using resolved profile id
      const application = this.repository.create({
        ...payload,
        createdAt: data.createdAt ?? new Date(),
      });

      // Explicitly cast to unknown before casting to JobApplication
      const savedApplication = (await this.repository.save(
        application,
      )) as unknown as JobApplication;
      return savedApplication;
    }
  }

  /**
   * Create all job applications from seed data
   */
  async createAll(): Promise<JobApplication[]> {
    console.log('🔄 Upserting job application records...');

    const applications: JobApplication[] = [];

    for (const appData of JOB_APPLICATIONS_DATA) {
      try {
        const application = await this.createOrUpdateJobApplication(appData);
        applications.push(application);

        // Update job applicant count
        await this.updateJobApplicantCount(appData.jobId);
      } catch (error: any) {
        console.warn(
          `⚠️  Failed to upsert job application for job ${appData.jobId} and jobseeker ${appData.jobseekerProfileId}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${applications.length} job application records`);
    return applications;
  }

  /**
   * Update the applicant count for a job
   */
  private async updateJobApplicantCount(jobId: string): Promise<void> {
    const applicationCount = await this.repository.count({
      where: { jobId },
    });

    await this.jobRepository.update(
      { id: jobId },
      { applicantsCount: applicationCount },
    );
  }
}
