import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { JobApplication } from '@app/common/database/entities/JobApplication.entity';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';
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

  /**
   * Create or update a job application
   */
  async createOrUpdateJobApplication(data: any): Promise<JobApplication> {
    // Check if job exists
    const job = await this.jobRepository.findOne({ where: { id: data.jobId } });
    if (!job) {
      throw new Error(`Job with ID ${data.jobId} not found`);
    }

    // Check if jobseeker profile exists
    const profile = await this.jobseekerProfileRepository.findOne({
      where: { id: data.jobseekerProfileId },
    });
    if (!profile) {
      throw new Error(
        `JobSeeker profile with ID ${data.jobseekerProfileId} not found`,
      );
    }

    // Check if application already exists (prevent duplicates)
    const existingApplication = await this.repository.findOne({
      where: {
        jobId: data.jobId,
        jobseekerProfileId: data.jobseekerProfileId,
      },
    });

    if (existingApplication) {
      // Update existing application
      await this.repository.update(
        { id: existingApplication.id },
        {
          ...data,
          updatedAt: new Date(),
        },
      );
      return (await this.repository.findOne({
        where: { id: existingApplication.id },
      })) as JobApplication;
    } else {
      // Create new application
      const application = this.repository.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
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
