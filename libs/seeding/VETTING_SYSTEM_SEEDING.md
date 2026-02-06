# Job Applicant Seeding for Vetting System Testing

This comprehensive seeding implementation provides realistic data for testing the automatic vetting system. It creates diverse jobseeker profiles, job applications, and skill relationships to thoroughly test all aspects of the vetting algorithm.

## 📋 What's Included

### 1. **Comprehensive Jobseeker Data** (`jobseekers.data.ts`)

- **10 diverse candidates** with varying backgrounds:
  - Senior technical professionals (Full-Stack, Data Analyst)
  - Junior developers (Frontend with limited experience)
  - Business professionals (Financial Analyst, Sales Manager)
  - Entry-level candidates (Customer Service, Housekeeper)
  - Security and transport workers
  - **Incomplete profile candidates** (for testing profile completeness scoring)

### 2. **Job Application Factory** (`job-application.factory.ts`)

- Handles job application creation and updates
- Prevents duplicate applications
- Updates job applicant counts automatically
- Validates job and jobseeker existence

### 3. **Strategic Job Applications** (`job-applications.data.ts`)

- **20+ application scenarios** testing:
  - Perfect skill matches vs. poor matches
  - Location-based applications (proximity testing)
  - Early vs. late applications (speed testing)
  - Cross-category applications
  - Multiple applications per candidate
  - Overqualified vs. underqualified scenarios

### 4. **Enhanced Jobseeker Factory**

- Properly handles skill relationships
- Creates JobseekerSkill entities with proficiency levels
- Manages complete profile data (location, experience, preferences)

## 🚀 Usage

### Running the Seeding

```bash
# Through your existing seeding system
npm run seed -- jobseekers jobs job-applications

# Or seed everything
npm run seed
```

### Using the Test Script

```typescript
import { runJobApplicantSeeding } from '@app/seeding/lib/scripts/test-vetting-seeding';

await runJobApplicantSeeding();
```

## 🔬 Testing Scenarios Created

### **Skill Matching Tests**

- **Perfect Matches**: Senior developer applying to TypeScript/React positions
- **Partial Matches**: Data analyst applying to data engineering roles
- **Poor Matches**: Driver applying to frontend developer positions
- **Cross-Category**: Sales professional applying to marketing roles

### **Experience Level Tests**

- **Overqualified**: 7-year developer applying to junior positions
- **Underqualified**: 1-year developer applying to senior roles
- **Perfect Fit**: Experience level matching job requirements

### **Profile Completeness Tests**

- **Complete Profiles**: All fields filled, skills added, CV uploaded
- **Incomplete Profiles**: Missing location, skills, or job title
- **Partial Profiles**: Some fields filled but lacking key information

### **Location/Proximity Tests**

- **Local Candidates**: Lagos candidates applying to Lagos jobs
- **Remote Candidates**: Abuja candidates applying to Lagos jobs
- **Relocation Willing**: Candidates explicitly mentioning relocation

### **Application Speed Tests**

- **Early Birds**: Applications within hours of job posting
- **Standard**: Applications within 1-3 days
- **Late Applications**: Applications after 5+ days

## 📊 Data Distribution

### **Skill Categories Covered**

- **Technical**: JavaScript, TypeScript, React, Python, Data Analysis
- **Business**: Financial Analysis, Accounting, Project Management
- **Communication**: Customer Service, Sales
- **Operations**: Housekeeping, Security, Transport
- **Mixed**: Candidates with cross-category skills

### **Experience Levels**

- **Senior (7-10 years)**: 20% of candidates
- **Mid-level (4-6 years)**: 30% of candidates
- **Junior (1-3 years)**: 30% of candidates
- **Entry-level/Career change**: 20% of candidates

### **Geographic Distribution**

- **Lagos**: 60% (matches most job locations)
- **Abuja**: 20%
- **Other states**: 20%

## 🎯 Vetting System Testing

After running the seeding, you can test the vetting system with these scenarios:

### **1. High-Competition Technical Job**

```typescript
// Frontend Engineer (TypeScript) - Job ID: CONSTANT_IDS.JOBS[6]
// Expected highlighted candidates:
// 1. Adebayo (Perfect match - Advanced TypeScript/React)
// 2. Emmanuel (Good match - React experience, junior level)
// 3. Others ranked by profile completeness/location
```

### **2. Specialized Business Role**

```typescript
// Financial Analyst - Job ID: CONSTANT_IDS.JOBS[12]
// Expected result:
// 1. Funmilayo (Perfect match - CPA, 6 years finance experience)
// Clear winner with high score
```

### **3. Entry-Level Position**

```typescript
// Customer Support Specialist - Job ID: CONSTANT_IDS.JOBS[20]
// Expected highlighted candidates:
// 1. Blessing (Perfect match - 2 years customer service)
// 2. Others ranked by communication skills and location
```

## 🔧 Customization

### **Adding More Candidates**

```typescript
// In jobseekers.data.ts
export const JOBSEEKERS_DATA = [
  // ... existing candidates
  {
    id: CONSTANT_IDS.JOBSEEKERS[10], // Use next available ID
    firstName: 'Your',
    lastName: 'Candidate',
    // ... complete profile data
  },
];
```

### **Creating New Application Scenarios**

```typescript
// In job-applications.data.ts
export const JOB_APPLICATIONS_DATA = [
  // ... existing applications
  {
    jobId: CONSTANT_IDS.JOBS[X],
    jobseekerProfileId: CONSTANT_IDS.JOBSEEKERS[Y],
    status: JobApplicationStatus.APPLIED,
    // ... application details
  },
];
```

## 🚨 Important Notes

1. **Dependencies**: Ensure skills and jobs are seeded before job applications
2. **Data Consistency**: All referenced skill IDs and job IDs must exist
3. **Profile Completeness**: Varies intentionally to test completeness scoring
4. **Realistic Data**: All phone numbers, addresses use Nigerian formats
5. **Email Uniqueness**: Each candidate has a unique email address

## 🔍 Monitoring Vetting Results

After seeding, trigger vetting for test jobs and monitor:

```typescript
// Example vetting test
const result = await jobVettingService.vetJobApplications(CONSTANT_IDS.JOBS[6]);

console.log(`Total applicants: ${result.totalApplicants}`);
console.log(`Highlighted: ${result.highlightedCount}`);
console.log(
  'Top candidates:',
  result.vettedApplicants
    .filter((a) => a.isHighlighted)
    .map((a) => ({
      name: `${a.jobseekerProfile.firstName} ${a.jobseekerProfile.lastName}`,
      score: a.score,
      profileCompleteness: a.profileCompleteness,
      experienceScore: a.experienceScore,
      skillMatchScore: a.skillMatchScore,
    })),
);
```

This seeding setup provides comprehensive test data to validate and refine your automatic vetting system algorithms!
