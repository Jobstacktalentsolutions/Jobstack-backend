import { CONSTANT_IDS } from './constant.data';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';

export const JOB_APPLICATIONS_DATA: any[] = [
  // TECHNICAL JOBS - Frontend Engineer (React/TypeScript)
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer (TypeScript)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo (Senior Full-Stack Developer) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 8500000,
    note: 'Available for immediate start',
    createdAt: new Date('2027-02-01T09:00:00Z'), // Early application
  },
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer (TypeScript)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[2], // Emmanuel (Frontend Developer) - Junior level, good match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4000000,
    createdAt: new Date('2027-02-01T14:30:00Z'),
  },
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer (TypeScript)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[7], // Tunde (Incomplete profile) - Test low profile completeness
    status: JobApplicationStatus.APPLIED,
    createdAt: new Date('2027-02-05T16:45:00Z'), // Late application
  },

  // TECHNICAL JOBS - Data Engineer
  {
    jobId: CONSTANT_IDS.JOBS[21], // Data Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[1], // Chiamaka (Data Analyst) - Good match for data role
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 6500000,
    createdAt: new Date('2027-02-01T10:15:00Z'),
  },
  {
    jobId: CONSTANT_IDS.JOBS[21], // Data Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo (Full-Stack) - Overqualified but relevant
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 9000000,
    createdAt: new Date('2027-02-02T11:20:00Z'),
  },

  // BUSINESS JOBS - Financial Analyst
  {
    jobId: CONSTANT_IDS.JOBS[12], // Financial Analyst
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[3], // Funmilayo (Financial Analyst) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 7500000,
    createdAt: new Date('2027-02-01T08:45:00Z'), // Very early application
  },

  // SALES JOBS - Sales Account Executive
  {
    jobId: CONSTANT_IDS.JOBS[13], // Sales Account Executive
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[4], // Ibrahim (Sales Manager) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 8500000,
    createdAt: new Date('2027-02-01T09:30:00Z'),
  },
  {
    jobId: CONSTANT_IDS.JOBS[13], // Sales Account Executive
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[5], // Blessing (Customer Service) - Career change, less ideal but possible
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4500000,
    createdAt: new Date('2027-02-03T13:00:00Z'),
  },

  // CUSTOMER SERVICE JOBS
  {
    jobId: CONSTANT_IDS.JOBS[20], // Customer Support Specialist
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[5], // Blessing (Customer Service) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 3200000,
    createdAt: new Date('2027-02-01T11:00:00Z'),
  },
  {
    jobId: CONSTANT_IDS.JOBS[20], // Customer Support Specialist
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[7], // Tunde (Incomplete profile)
    status: JobApplicationStatus.APPLIED,
    createdAt: new Date('2027-02-04T15:30:00Z'),
  },

  // HOME SUPPORT JOBS - Housekeeping
  {
    jobId: CONSTANT_IDS.JOBS[10], // Housekeeping Supervisor
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[6], // Kemi (Housekeeper) - Perfect match, experienced
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 2600000,
    createdAt: new Date('2027-02-01T12:00:00Z'),
  },

  // SECURITY JOBS
  {
    jobId: CONSTANT_IDS.JOBS[11], // Security Operations Lead
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[8], // Mohammed (Security Guard) - Excellent match with military background
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4000000,
    createdAt: new Date('2027-02-01T07:30:00Z'), // Earliest application
  },

  // Cross-category applications (candidates applying to multiple jobs)

  // Adebayo applying to multiple technical roles
  {
    jobId: CONSTANT_IDS.JOBS[3], // Backend Engineer (Node.js)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 9500000,
    createdAt: new Date('2027-02-01T16:00:00Z'),
  },
  {
    jobId: CONSTANT_IDS.JOBS[5], // DevOps Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 8800000,
    createdAt: new Date('2027-02-02T09:00:00Z'),
  },

  // Emmanuel (junior) applying to multiple entry-level tech roles
  {
    jobId: CONSTANT_IDS.JOBS[4], // UI/UX Designer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[2], // Emmanuel
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4200000,
    createdAt: new Date('2027-02-02T14:00:00Z'),
  },

  // Ibrahim (Sales Manager) applying to related roles
  {
    jobId: CONSTANT_IDS.JOBS[15], // Content Marketing Lead
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[4], // Ibrahim
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 6500000,
    createdAt: new Date('2027-02-02T10:30:00Z'),
  },

  // Out-of-location applications (testing proximity scoring)
  {
    jobId: CONSTANT_IDS.JOBS[0], // Senior Software Engineer (Lagos-based)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[1], // Chiamaka (Abuja-based) - Wrong location
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 7000000,
    createdAt: new Date('2027-02-03T11:00:00Z'),
  },

  // Late applications (testing application speed scoring)
  {
    jobId: CONSTANT_IDS.JOBS[22], // React Native Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[2], // Emmanuel
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4500000,
    createdAt: new Date('2027-02-10T18:00:00Z'), // Very late application
  },

  // Additional applications for jobs that need more candidates to test vetting
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer - More candidates for competitive testing
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[9], // Olumide (Driver) - Unqualified candidate
    status: JobApplicationStatus.APPLIED,
    createdAt: new Date('2027-02-06T12:00:00Z'),
  },

  // Transport & Logistics
  {
    jobId: CONSTANT_IDS.JOBS[45], // Logistics Coordinator (if exists, otherwise use available transport job)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[9], // Olumide (Driver)
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 3200000,
    createdAt: new Date('2027-02-01T13:30:00Z'),
  },
];
