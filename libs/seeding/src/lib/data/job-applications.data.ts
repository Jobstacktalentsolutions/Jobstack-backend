import { CONSTANT_IDS } from './constant.data';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';
import { JOBS_DATA } from './jobs.data';
import { JOBSEEKERS_DATA } from './jobseekers.data';

type JobApplicationSeed = {
  jobId: string;
  jobseekerProfileId: string;
  status: JobApplicationStatus;
  expectedSalary?: number;
  note?: string;
  createdAt: Date;
};

// Use current date at seed time; offset by days/weeks so "Applied" shows e.g. "2 days ago", "1 week ago"
const seedNow = new Date();

/** Returns a date N days ago from seed time, with optional hour/minute for variety. */
function daysAgo(days: number, hour = 9, minute = 0): Date {
  const d = new Date(seedNow);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Base, hand-crafted applications used for specific vetting scenarios
const BASE_JOB_APPLICATIONS_DATA: JobApplicationSeed[] = [
  // TECHNICAL JOBS - Frontend Engineer (React/TypeScript)
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer (TypeScript)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo (Senior Full-Stack Developer) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 8500000,
    note: 'Available for immediate start',
    createdAt: daysAgo(1, 9, 0), // Early application
  },
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer (TypeScript)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[2], // Emmanuel (Frontend Developer) - Junior level, good match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4000000,
    createdAt: daysAgo(1, 14, 30),
  },
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer (TypeScript)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[7], // Tunde (Incomplete profile) - Test low profile completeness
    status: JobApplicationStatus.APPLIED,
    createdAt: daysAgo(5, 16, 45), // Late application
  },

  // TECHNICAL JOBS - Data Engineer
  {
    jobId: CONSTANT_IDS.JOBS[21], // Data Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[1], // Chiamaka (Data Analyst) - Good match for data role
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 6500000,
    createdAt: daysAgo(1, 10, 15),
  },
  {
    jobId: CONSTANT_IDS.JOBS[21], // Data Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo (Full-Stack) - Overqualified but relevant
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 9000000,
    createdAt: daysAgo(2, 11, 20),
  },

  // BUSINESS JOBS - Financial Analyst
  {
    jobId: CONSTANT_IDS.JOBS[12], // Financial Analyst
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[3], // Funmilayo (Financial Analyst) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 7500000,
    createdAt: daysAgo(0, 8, 45), // Very early application
  },

  // SALES JOBS - Sales Account Executive
  {
    jobId: CONSTANT_IDS.JOBS[13], // Sales Account Executive
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[4], // Ibrahim (Sales Manager) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 8500000,
    createdAt: daysAgo(1, 9, 30),
  },
  {
    jobId: CONSTANT_IDS.JOBS[13], // Sales Account Executive
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[5], // Blessing (Customer Service) - Career change, less ideal but possible
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4500000,
    createdAt: daysAgo(3, 13, 0),
  },

  // CUSTOMER SERVICE JOBS
  {
    jobId: CONSTANT_IDS.JOBS[20], // Customer Support Specialist
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[5], // Blessing (Customer Service) - Perfect match
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 3200000,
    createdAt: daysAgo(1, 11, 0),
  },
  {
    jobId: CONSTANT_IDS.JOBS[20], // Customer Support Specialist
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[7], // Tunde (Incomplete profile)
    status: JobApplicationStatus.APPLIED,
    createdAt: daysAgo(4, 15, 30),
  },

  // HOME SUPPORT JOBS - Housekeeping
  {
    jobId: CONSTANT_IDS.JOBS[10], // Housekeeping Supervisor
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[6], // Kemi (Housekeeper) - Perfect match, experienced
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 2600000,
    createdAt: daysAgo(1, 12, 0),
  },

  // SECURITY JOBS
  {
    jobId: CONSTANT_IDS.JOBS[11], // Security Operations Lead
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[8], // Mohammed (Security Guard) - Excellent match with military background
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4000000,
    createdAt: daysAgo(0, 7, 30), // Earliest application
  },

  // Cross-category applications (candidates applying to multiple jobs)

  // Adebayo applying to multiple technical roles
  {
    jobId: CONSTANT_IDS.JOBS[3], // Backend Engineer (Node.js)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 9500000,
    createdAt: daysAgo(1, 16, 0),
  },
  {
    jobId: CONSTANT_IDS.JOBS[5], // DevOps Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[0], // Adebayo
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 8800000,
    createdAt: daysAgo(2, 9, 0),
  },

  // Emmanuel (junior) applying to multiple entry-level tech roles
  {
    jobId: CONSTANT_IDS.JOBS[4], // UI/UX Designer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[2], // Emmanuel
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4200000,
    createdAt: daysAgo(2, 14, 0),
  },

  // Ibrahim (Sales Manager) applying to related roles
  {
    jobId: CONSTANT_IDS.JOBS[15], // Content Marketing Lead
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[4], // Ibrahim
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 6500000,
    createdAt: daysAgo(2, 10, 30),
  },

  // Out-of-location applications (testing proximity scoring)
  {
    jobId: CONSTANT_IDS.JOBS[0], // Senior Software Engineer (Lagos-based)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[1], // Chiamaka (Abuja-based) - Wrong location
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 7000000,
    createdAt: daysAgo(3, 11, 0),
  },

  // Late applications (testing application speed scoring)
  {
    jobId: CONSTANT_IDS.JOBS[22], // React Native Engineer
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[2], // Emmanuel
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 4500000,
    createdAt: daysAgo(10, 18, 0), // Very late application
  },

  // Additional applications for jobs that need more candidates to test vetting
  {
    jobId: CONSTANT_IDS.JOBS[6], // Frontend Engineer - More candidates for competitive testing
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[9], // Olumide (Driver) - Unqualified candidate
    status: JobApplicationStatus.APPLIED,
    createdAt: daysAgo(6, 12, 0),
  },

  // Transport & Logistics
  {
    jobId: CONSTANT_IDS.JOBS[45], // Logistics Coordinator (if exists, otherwise use available transport job)
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[9], // Olumide (Driver)
    status: JobApplicationStatus.APPLIED,
    expectedSalary: 3200000,
    createdAt: daysAgo(1, 13, 30),
  },
];

// Build map of existing applications per job for quick lookup
const applicationsByJobId = new Map<string, JobApplicationSeed[]>();
for (const app of BASE_JOB_APPLICATIONS_DATA) {
  const list = applicationsByJobId.get(app.jobId) ?? [];
  list.push(app);
  applicationsByJobId.set(app.jobId, list);
}

// Track jobId/jobseeker pairs to avoid duplicates across base and generated data
const existingPairs = new Set(
  BASE_JOB_APPLICATIONS_DATA.map(
    (app) => `${app.jobId}:${app.jobseekerProfileId}`,
  ),
);

// Build a deterministic createdAt relative to current date: 0–21 days ago, varied time of day
function buildCreatedAt(jobIndex: number, orderIndex: number): Date {
  const daysOffset = (jobIndex * 2 + orderIndex) % 22;
  const date = new Date(seedNow);
  date.setDate(date.getDate() - daysOffset);
  date.setHours(9 + (orderIndex % 8), (orderIndex % 4) * 15, 0, 0);
  return date;
}

// Compute a realistic expected salary around the job salary
function getExpectedSalary(
  jobSalary: number | undefined,
  jobIndex: number,
  rankIndex: number,
): number | undefined {
  if (!jobSalary) return undefined;
  const factors = [0.95, 1, 1.05];
  const factor = factors[(jobIndex + rankIndex) % factors.length];
  return Math.round(jobSalary * factor);
}

// Job indices that get 8 applications each for full screening/vetting tests (5–10 jobs)
const JOBS_WITH_8_APPLICATIONS = new Set([
  0, 1, 2, 3, 5, 6, 12, 21,
]); // Full Stack, Product Manager, Data Analyst, Backend, DevOps, Frontend, Financial Analyst, Data Engineer

// Generated applications: at least 3 per job; 8 per job for the set above
const GENERATED_JOB_APPLICATIONS_DATA: JobApplicationSeed[] = [];

JOBS_DATA.forEach((job, jobIndex) => {
  const baseForJob = applicationsByJobId.get(job.id) ?? [];
  const baseCount = baseForJob.length;

  const targetCount = JOBS_WITH_8_APPLICATIONS.has(jobIndex)
    ? 8
    : Math.max(3, baseCount);
  const toGenerate = targetCount - baseCount;
  if (toGenerate <= 0) {
    return;
  }

  const jobSkillIds = (job.skills ?? []) as string[];
  const jobSkillSet = new Set<string>(jobSkillIds);

  // Primary candidates share at least one skill with the job
  const matchingCandidates = JOBSEEKERS_DATA.filter((js: any) =>
    (js.skills ?? []).some((s) => jobSkillSet.has(s.skillId)),
  );

  // Secondary candidates match primarily on location preference
  const locationCandidates = JOBSEEKERS_DATA.filter((js: any) => {
    if (!job.state) return false;
    return (
      js.state === job.state ||
      js.city === job.city ||
      js.preferredLocation === job.state
    );
  });

  // Fallback candidates: everyone, used only if we cannot hit the minimum
  const allCandidates = JOBSEEKERS_DATA;

  // Combine and deduplicate candidates, prioritising skill matches
  const combinedCandidates: any[] = [];
  const seenJobseekerIds = new Set<string>();
  for (const group of [matchingCandidates, locationCandidates, allCandidates]) {
    for (const js of group) {
      if (seenJobseekerIds.has(js.id)) continue;
      seenJobseekerIds.add(js.id);
      combinedCandidates.push(js);
    }
  }

  let generatedForJob = 0;
  let candidateIndex = 0;

  while (
    generatedForJob < toGenerate &&
    candidateIndex < combinedCandidates.length
  ) {
    const candidate = combinedCandidates[candidateIndex++];
    const key = `${job.id}:${candidate.id}`;

    if (existingPairs.has(key)) {
      continue;
    }

    existingPairs.add(key);

    const newApp: JobApplicationSeed = {
      jobId: job.id,
      jobseekerProfileId: candidate.id,
      status: JobApplicationStatus.APPLIED,
      expectedSalary: getExpectedSalary(
        job.salary,
        jobIndex,
        baseCount + generatedForJob,
      ),
      createdAt: buildCreatedAt(jobIndex, baseCount + generatedForJob),
    };

    GENERATED_JOB_APPLICATIONS_DATA.push(newApp);
    generatedForJob += 1;
  }
});

export const JOB_APPLICATIONS_DATA: any[] = [
  ...BASE_JOB_APPLICATIONS_DATA,
  ...GENERATED_JOB_APPLICATIONS_DATA,
];
