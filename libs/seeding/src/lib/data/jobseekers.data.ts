import { CONSTANT_IDS } from './constant.data';
import {
  ApprovalStatus,
  EmploymentType,
  EmploymentArrangement,
  WorkMode,
  SkillCategory,
} from '@app/common/database/entities/schema.enum';
import { hashSync } from 'bcryptjs';

// Precompute shared password hash for all seeded jobseekers
const passwordHash = hashSync('password123', 10);

// Comprehensive jobseeker data for testing the automatic vetting system
// These profiles vary in experience, skills, completeness, and location for thorough testing
export const JOBSEEKERS_DATA: any[] = [
  // TECHNICAL/HIGH-SKILL CANDIDATES
  {
    id: CONSTANT_IDS.JOBSEEKERS[0],
    firstName: 'Adebayo',
    lastName: 'Ogundimu',
    email: 'adebayo.ogundimu@example.com',
    phoneNumber: '+2348134567890',
    address: '15 Victoria Island, Lagos',
    state: 'Lagos',
    city: 'Victoria Island',
    passwordHash,

    // Profile data
    jobTitle: 'Senior Full-Stack Developer',
    brief:
      'Experienced developer with expertise in modern web technologies and cloud platforms',
    yearsOfExperience: 7,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 8500000,
    maxExpectedSalary: 12000000,
    approvalStatus: ApprovalStatus.APPROVED,

    // Skills with proficiency levels
    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[0],
        proficiency: 'ADVANCED',
        yearsExperience: 7,
      }, // JavaScript
      {
        skillId: CONSTANT_IDS.SKILLS[2],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // React
      {
        skillId: CONSTANT_IDS.SKILLS[3],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // TypeScript
      {
        skillId: CONSTANT_IDS.SKILLS[4],
        proficiency: 'ADVANCED',
        yearsExperience: 6,
      }, // Node.js
    ],
  },

  {
    id: CONSTANT_IDS.JOBSEEKERS[1],
    firstName: 'Chiamaka',
    lastName: 'Okafor',
    email: 'chiamaka.okafor@example.com',
    phoneNumber: '+2349123456789',
    address: '22 Wuse II, Abuja',
    state: 'FCT',
    city: 'Abuja',
    passwordHash,

    jobTitle: 'Data Analyst',
    brief:
      'Data professional with strong analytical skills and Python expertise',
    yearsOfExperience: 4,
    preferredLocation: 'Abuja',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 5000000,
    maxExpectedSalary: 7500000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[1],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // Python
      {
        skillId: CONSTANT_IDS.SKILLS[10],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Data Analysis
      {
        skillId: CONSTANT_IDS.SKILLS[5],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 2,
      }, // PostgreSQL
    ],
  },

  // JUNIOR TECHNICAL CANDIDATE
  {
    id: CONSTANT_IDS.JOBSEEKERS[2],
    firstName: 'Emmanuel',
    lastName: 'Adeyemi',
    email: 'emmanuel.adeyemi@example.com',
    phoneNumber: '+2348098765432',
    address: '8 Ikeja GRA, Lagos',
    state: 'Lagos',
    city: 'Ikeja',
    passwordHash,

    jobTitle: 'Frontend Developer',
    brief: 'Recent graduate passionate about modern web development',
    yearsOfExperience: 1,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 3000000,
    maxExpectedSalary: 4500000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[0],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 1,
      }, // JavaScript
      {
        skillId: CONSTANT_IDS.SKILLS[2],
        proficiency: 'BEGINNER',
        yearsExperience: 1,
      }, // React
      {
        skillId: CONSTANT_IDS.SKILLS[12],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 1,
      }, // UI/UX Design
    ],
  },

  // BUSINESS/FINANCE CANDIDATES
  {
    id: CONSTANT_IDS.JOBSEEKERS[3],
    firstName: 'Funmilayo',
    lastName: 'Adesanya',
    email: 'funmilayo.adesanya@example.com',
    phoneNumber: '+2347012345678',
    address: '45 Ikoyi, Lagos',
    state: 'Lagos',
    city: 'Ikoyi',
    passwordHash,

    jobTitle: 'Financial Analyst',
    brief: 'CPA with extensive experience in financial modeling and analysis',
    yearsOfExperience: 6,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 6500000,
    maxExpectedSalary: 9000000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[14],
        proficiency: 'ADVANCED',
        yearsExperience: 6,
      }, // Accounting
      {
        skillId: CONSTANT_IDS.SKILLS[15],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Financial Analysis
      {
        skillId: CONSTANT_IDS.SKILLS[8],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Project Management
    ],
  },

  // SALES & MARKETING CANDIDATES
  {
    id: CONSTANT_IDS.JOBSEEKERS[4],
    firstName: 'Ibrahim',
    lastName: 'Musa',
    email: 'ibrahim.musa@example.com',
    phoneNumber: '+2348076543210',
    address: '12 Wuse I, Abuja',
    state: 'FCT',
    city: 'Abuja',
    passwordHash,

    jobTitle: 'Sales Manager',
    brief:
      'Results-driven sales professional with proven track record in B2B sales',
    yearsOfExperience: 8,
    preferredLocation: 'Abuja',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 7000000,
    maxExpectedSalary: 10000000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[16],
        proficiency: 'ADVANCED',
        yearsExperience: 8,
      }, // Sales
      {
        skillId: CONSTANT_IDS.SKILLS[11],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Communication
      {
        skillId: CONSTANT_IDS.SKILLS[8],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 4,
      }, // Project Management
    ],
  },

  // ENTRY LEVEL/LOW-SKILL CANDIDATES
  {
    id: CONSTANT_IDS.JOBSEEKERS[5],
    firstName: 'Blessing',
    lastName: 'Okoro',
    email: 'blessing.okoro@example.com',
    phoneNumber: '+2348165432109',
    address: '5 Surulere, Lagos',
    state: 'Lagos',
    city: 'Surulere',
    passwordHash,

    jobTitle: 'Customer Service Representative',
    brief: 'Dedicated professional with excellent interpersonal skills',
    yearsOfExperience: 2,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 2400000,
    maxExpectedSalary: 3600000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[11],
        proficiency: 'ADVANCED',
        yearsExperience: 2,
      }, // Communication
      {
        skillId: CONSTANT_IDS.SKILLS[17],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 2,
      }, // Customer Service
    ],
  },

  {
    id: CONSTANT_IDS.JOBSEEKERS[6],
    firstName: 'Kemi',
    lastName: 'Adenuga',
    email: 'kemi.adenuga@example.com',
    phoneNumber: '+2349087654321',
    address: '18 Yaba, Lagos',
    state: 'Lagos',
    city: 'Yaba',
    passwordHash,

    jobTitle: 'Housekeeper',
    brief: 'Experienced in residential cleaning and home management',
    yearsOfExperience: 5,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 1800000,
    maxExpectedSalary: 2800000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[22],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Housekeeping
      {
        skillId: CONSTANT_IDS.SKILLS[18],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Operations Management
    ],
  },

  // CANDIDATES WITH INCOMPLETE PROFILES (to test profile completeness scoring)
  {
    id: CONSTANT_IDS.JOBSEEKERS[7],
    firstName: 'Tunde',
    lastName: 'Bakare',
    email: 'tunde.bakare@example.com',
    phoneNumber: '+2348012345678',
    address: null, // Missing address
    state: null, // Missing location data
    city: null,
    passwordHash,

    jobTitle: null, // Missing job title
    brief: null, // Missing brief
    yearsOfExperience: null, // Missing experience
    preferredLocation: null,
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: null,
    maxExpectedSalary: null,
    approvalStatus: ApprovalStatus.PENDING,

    skills: [], // No skills added
  },

  // SECURITY & LOW-SKILL CANDIDATES
  {
    id: CONSTANT_IDS.JOBSEEKERS[8],
    firstName: 'Mohammed',
    lastName: 'Suleiman',
    email: 'mohammed.suleiman@example.com',
    phoneNumber: '+2347098765432',
    address: '30 Kaduna South, Kaduna',
    state: 'Kaduna',
    city: 'Kaduna',
    passwordHash,

    jobTitle: 'Security Guard',
    brief: 'Professional security guard with military background',
    yearsOfExperience: 10,
    preferredLocation: 'Kaduna',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 2400000,
    maxExpectedSalary: 4200000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[30],
        proficiency: 'ADVANCED',
        yearsExperience: 10,
      }, // Security Guarding
      {
        skillId: CONSTANT_IDS.SKILLS[31],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 8,
      }, // Gatekeeping
    ],
  },

  // TRANSPORT & LOGISTICS CANDIDATES
  {
    id: CONSTANT_IDS.JOBSEEKERS[9],
    firstName: 'Olumide',
    lastName: 'Fashola',
    email: 'olumide.fashola@example.com',
    phoneNumber: '+2348154321098',
    address: '7 Ojuelegba, Lagos',
    state: 'Lagos',
    city: 'Surulere',
    passwordHash,

    jobTitle: 'Professional Driver',
    brief: 'Licensed professional driver with clean driving record',
    yearsOfExperience: 3,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 2400000,
    maxExpectedSalary: 3600000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[32],
        proficiency: 'ADVANCED',
        yearsExperience: 3,
      }, // Professional Driving
      {
        skillId: CONSTANT_IDS.SKILLS[33],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 2,
      }, // Dispatch & Delivery
    ],
  },

  // Additional technical and specialist candidates
  {
    id: CONSTANT_IDS.JOBSEEKERS[10],
    firstName: 'Ngozi',
    lastName: 'Eze',
    email: 'ngozi.eze@example.com',
    phoneNumber: '+2348160001000',
    address: '10 Lekki Phase 1, Lagos',
    state: 'Lagos',
    city: 'Lekki',
    passwordHash,

    jobTitle: 'DevOps Engineer',
    brief:
      'DevOps engineer experienced with CI/CD, container orchestration and observability',
    yearsOfExperience: 5,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 7000000,
    maxExpectedSalary: 9500000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[4],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Node.js
      {
        skillId: CONSTANT_IDS.SKILLS[5],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // PostgreSQL
      {
        skillId: CONSTANT_IDS.SKILLS[18],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Operations Management
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[11],
    firstName: 'Zainab',
    lastName: 'Bello',
    email: 'zainab.bello@example.com',
    phoneNumber: '+2348170002000',
    address: '3 Yaba, Lagos',
    state: 'Lagos',
    city: 'Yaba',
    passwordHash,

    jobTitle: 'Product Designer',
    brief:
      'Product designer focused on mobile experiences, prototyping and user research',
    yearsOfExperience: 4,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 5200000,
    maxExpectedSalary: 7600000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[12],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // UI/UX Design
      {
        skillId: CONSTANT_IDS.SKILLS[13],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Graphic Design
      {
        skillId: CONSTANT_IDS.SKILLS[21],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Communication
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[12],
    firstName: 'Samuel',
    lastName: 'Okon',
    email: 'samuel.okon@example.com',
    phoneNumber: '+2348180003000',
    address: 'Broad Street, Lagos Island',
    state: 'Lagos',
    city: 'Lagos Island',
    passwordHash,

    jobTitle: 'Operations Analyst',
    brief:
      'Operations analyst with experience in process mapping, SLAs and logistics',
    yearsOfExperience: 5,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 4200000,
    maxExpectedSalary: 6200000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[18],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Operations Management
      {
        skillId: CONSTANT_IDS.SKILLS[19],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Supply Chain Management
      {
        skillId: CONSTANT_IDS.SKILLS[10],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Data Analysis
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[13],
    firstName: 'Ruth',
    lastName: 'Nwosu',
    email: 'ruth.nwosu@example.com',
    phoneNumber: '+2348190004000',
    address: 'Remote, Abuja',
    state: 'FCT',
    city: 'Abuja',
    passwordHash,

    jobTitle: 'Customer Support Specialist',
    brief:
      'Customer support specialist experienced with omnichannel support and ticketing tools',
    yearsOfExperience: 4,
    preferredLocation: 'Remote',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 2600000,
    maxExpectedSalary: 3600000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[11],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // Customer Service
      {
        skillId: CONSTANT_IDS.SKILLS[21],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // Communication
      {
        skillId: CONSTANT_IDS.SKILLS[9],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 2,
      }, // Digital Marketing
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[14],
    firstName: 'Ikechukwu',
    lastName: 'Nnaji',
    email: 'ikechukwu.nnaji@example.com',
    phoneNumber: '+2348100005000',
    address: 'Kaduna North, Kaduna',
    state: 'Kaduna',
    city: 'Kaduna',
    passwordHash,

    jobTitle: 'Security Supervisor',
    brief:
      'Security professional with experience supervising guards and handling incidents',
    yearsOfExperience: 8,
    preferredLocation: 'Kaduna',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 3000000,
    maxExpectedSalary: 4500000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[30],
        proficiency: 'ADVANCED',
        yearsExperience: 8,
      }, // Security Guarding
      {
        skillId: CONSTANT_IDS.SKILLS[31],
        proficiency: 'ADVANCED',
        yearsExperience: 6,
      }, // Gatekeeping
      {
        skillId: CONSTANT_IDS.SKILLS[18],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 4,
      }, // Operations Management
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[15],
    firstName: 'Grace',
    lastName: 'Afolabi',
    email: 'grace.afolabi@example.com',
    phoneNumber: '+2348110006000',
    address: 'Opebi, Ikeja',
    state: 'Lagos',
    city: 'Ikeja',
    passwordHash,

    jobTitle: 'Housekeeping Supervisor',
    brief:
      'Experienced housekeeping supervisor managing residential and office cleaning teams',
    yearsOfExperience: 6,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 2400000,
    maxExpectedSalary: 3600000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[22],
        proficiency: 'ADVANCED',
        yearsExperience: 6,
      }, // Housekeeping
      {
        skillId: CONSTANT_IDS.SKILLS[25],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 4,
      }, // Domestic Assistance
      {
        skillId: CONSTANT_IDS.SKILLS[18],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Operations Management
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[16],
    firstName: 'Desmond',
    lastName: 'Etim',
    email: 'desmond.etim@example.com',
    phoneNumber: '+2348120007000',
    address: 'Lekki Phase 2, Lagos',
    state: 'Lagos',
    city: 'Lekki',
    passwordHash,

    jobTitle: 'Dispatch Rider',
    brief:
      'Professional rider experienced with last-mile deliveries and customer interactions',
    yearsOfExperience: 4,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 2200000,
    maxExpectedSalary: 3200000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[32],
        proficiency: 'ADVANCED',
        yearsExperience: 4,
      }, // Professional Driving
      {
        skillId: CONSTANT_IDS.SKILLS[33],
        proficiency: 'ADVANCED',
        yearsExperience: 3,
      }, // Dispatch & Delivery
      {
        skillId: CONSTANT_IDS.SKILLS[21],
        proficiency: 'INTERMEDIATE',
        yearsExperience: 3,
      }, // Communication
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[17],
    firstName: 'Hadiza',
    lastName: 'Danladi',
    email: 'hadiza.danladi@example.com',
    phoneNumber: '+2348130008000',
    address: 'Garki, Abuja',
    state: 'FCT',
    city: 'Abuja',
    passwordHash,

    jobTitle: 'Content Marketing Manager',
    brief:
      'Content marketer with experience in SEO, email and social media campaigns',
    yearsOfExperience: 6,
    preferredLocation: 'Abuja',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 4200000,
    maxExpectedSalary: 6200000,
    approvalStatus: ApprovalStatus.APPROVED,

    skills: [
      {
        skillId: CONSTANT_IDS.SKILLS[17],
        proficiency: 'ADVANCED',
        yearsExperience: 6,
      }, // Content Marketing
      {
        skillId: CONSTANT_IDS.SKILLS[9],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Digital Marketing
      {
        skillId: CONSTANT_IDS.SKILLS[21],
        proficiency: 'ADVANCED',
        yearsExperience: 5,
      }, // Communication
    ],
  },
  // --- ADDED 30 NEW JOBSEEKERS ---
  {
    id: CONSTANT_IDS.JOBSEEKERS[18],
    firstName: 'Bisi',
    lastName: 'Akande',
    email: 'bisi.akande@example.com',
    phoneNumber: '+2348000000018',
    address: '12 Maryland, Lagos',
    state: 'Lagos',
    city: 'Ikeja',
    passwordHash,
    jobTitle: 'Backend Engineer',
    brief: 'Node.js specialist with strong SQL and performance optimization skills',
    yearsOfExperience: 5,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 6000000,
    maxExpectedSalary: 8500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[4], proficiency: 'ADVANCED', yearsExperience: 5 }, // Node.js
      { skillId: CONSTANT_IDS.SKILLS[5], proficiency: 'ADVANCED', yearsExperience: 4 }, // PostgreSQL
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[19],
    firstName: 'Chidi',
    lastName: 'Nnamani',
    email: 'chidi.nnamani@example.com',
    phoneNumber: '+2348000000019',
    address: '5 Lekki, Lagos',
    state: 'Lagos',
    city: 'Lekki',
    passwordHash,
    jobTitle: 'Frontend Engineer',
    brief: 'React and TypeScript expert with a focus on building accessible user interfaces',
    yearsOfExperience: 4,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 5500000,
    maxExpectedSalary: 8000000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[2], proficiency: 'ADVANCED', yearsExperience: 4 }, // React
      { skillId: CONSTANT_IDS.SKILLS[3], proficiency: 'ADVANCED', yearsExperience: 3 }, // TypeScript
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[20],
    firstName: 'Dayo',
    lastName: 'Adewale',
    email: 'dayo.adewale@example.com',
    phoneNumber: '+2348000000020',
    address: '20 Maitama, Abuja',
    state: 'FCT',
    city: 'Abuja',
    passwordHash,
    jobTitle: 'Product Manager',
    brief: 'Strategic thinker with a background in data-driven product development',
    yearsOfExperience: 6,
    preferredLocation: 'Abuja',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 8000000,
    maxExpectedSalary: 11000000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[8], proficiency: 'ADVANCED', yearsExperience: 6 }, // PM
      { skillId: CONSTANT_IDS.SKILLS[10], proficiency: 'INTERMEDIATE', yearsExperience: 3 }, // Data Analysis
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[21],
    firstName: 'Efosa',
    lastName: 'Igbinoba',
    email: 'efosa.igbinoba@example.com',
    phoneNumber: '+2348000000021',
    address: '8 GRA, Benin City',
    state: 'Edo',
    city: 'Benin City',
    passwordHash,
    jobTitle: 'Data Engineer',
    brief: 'Expert in building robust data pipelines and managing large-scale databases',
    yearsOfExperience: 5,
    preferredLocation: 'Remote',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.CONTRACT,
    minExpectedSalary: 7500000,
    maxExpectedSalary: 10000000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[1], proficiency: 'ADVANCED', yearsExperience: 5 }, // Python
      { skillId: CONSTANT_IDS.SKILLS[5], proficiency: 'ADVANCED', yearsExperience: 4 }, // PostgreSQL
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[22],
    firstName: 'Fatima',
    lastName: 'Usman',
    email: 'fatima.usman@example.com',
    phoneNumber: '+2348000000022',
    address: '15 Nasarawa, Kano',
    state: 'Kano',
    city: 'Kano',
    passwordHash,
    jobTitle: 'Financial Accountant',
    brief: 'Detail-oriented accountant with extensive experience in corporate taxation',
    yearsOfExperience: 7,
    preferredLocation: 'Kano',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 5000000,
    maxExpectedSalary: 7500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[14], proficiency: 'ADVANCED', yearsExperience: 7 }, // Accounting
      { skillId: CONSTANT_IDS.SKILLS[15], proficiency: 'INTERMEDIATE', yearsExperience: 4 }, // Financial Analysis
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[23],
    firstName: 'Gideon',
    lastName: 'Oloyede',
    email: 'gideon.oloyede@example.com',
    phoneNumber: '+2348000000023',
    address: '2 Bodija, Ibadan',
    state: 'Oyo',
    city: 'Ibadan',
    passwordHash,
    jobTitle: 'Sales Representative',
    brief: 'Dynamic sales professional with a focus on technology services',
    yearsOfExperience: 3,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 3500000,
    maxExpectedSalary: 5500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[16], proficiency: 'ADVANCED', yearsExperience: 3 }, // Sales
      { skillId: CONSTANT_IDS.SKILLS[11], proficiency: 'ADVANCED', yearsExperience: 3 }, // Communication
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[24],
    firstName: 'Hope',
    lastName: 'Nelson',
    email: 'hope.nelson@example.com',
    phoneNumber: '+2348000000024',
    address: '10 Trans-Amadi, Port Harcourt',
    state: 'Rivers',
    city: 'Port Harcourt',
    passwordHash,
    jobTitle: 'Operations Manager',
    brief: 'Experienced operations leader skilled in logistics and supply chain optimization',
    yearsOfExperience: 8,
    preferredLocation: 'Port Harcourt',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 7000000,
    maxExpectedSalary: 9500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[18], proficiency: 'ADVANCED', yearsExperience: 8 }, // Operations
      { skillId: CONSTANT_IDS.SKILLS[19], proficiency: 'ADVANCED', yearsExperience: 6 }, // Supply Chain
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[25],
    firstName: 'Ifeanyi',
    lastName: 'Duru',
    email: 'ifeanyi.duru@example.com',
    phoneNumber: '+2348000000025',
    address: '4 Independence Layout, Enugu',
    state: 'Enugu',
    city: 'Enugu',
    passwordHash,
    jobTitle: 'Graphic Designer',
    brief: 'Creative designer specialized in brand identity and digital assets',
    yearsOfExperience: 4,
    preferredLocation: 'Remote',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.CONTRACT,
    minExpectedSalary: 2500000,
    maxExpectedSalary: 4500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[13], proficiency: 'ADVANCED', yearsExperience: 4 }, // Graphic Design
      { skillId: CONSTANT_IDS.SKILLS[12], proficiency: 'INTERMEDIATE', yearsExperience: 2 }, // UI/UX
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[26],
    firstName: 'Joy',
    lastName: 'Edem',
    email: 'joy.edem@example.com',
    phoneNumber: '+2348000000026',
    address: '7 Calabar Municipality, Cross River',
    state: 'Cross River',
    city: 'Calabar',
    passwordHash,
    jobTitle: 'Customer Success Specialist',
    brief: 'Dedicated professional with a background in client relationship management',
    yearsOfExperience: 5,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 3000000,
    maxExpectedSalary: 5000000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[11], proficiency: 'ADVANCED', yearsExperience: 5 }, // Customer Service
      { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 5 }, // Communication
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[27],
    firstName: 'Kelechi',
    lastName: 'Ogbodo',
    email: 'kelechi.ogbodo@example.com',
    phoneNumber: '+2348000000027',
    address: '18 Ajah, Lagos',
    state: 'Lagos',
    city: 'Ajah',
    passwordHash,
    jobTitle: 'DevOps Engineer',
    brief: 'Cloud infrastructure expert with mastery in AWS, Docker, and Kubernetes',
    yearsOfExperience: 6,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 8000000,
    maxExpectedSalary: 11000000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[4], proficiency: 'ADVANCED', yearsExperience: 5 }, // Node (placeholder for tech backend)
      { skillId: CONSTANT_IDS.SKILLS[5], proficiency: 'INTERMEDIATE', yearsExperience: 3 }, // SQL
    ],
  },
  // --- 10 for Jobseekers with NO applications initially ---
  {
    id: CONSTANT_IDS.JOBSEEKERS[28],
    firstName: 'Lilian',
    lastName: 'Eze',
    email: 'lilian.eze@example.com',
    phoneNumber: '+2348000000028',
    address: '10 Akure, Ondo',
    state: 'Ondo',
    city: 'Akure',
    passwordHash,
    jobTitle: 'Content Writer',
    brief: 'Skilled copywriter and editor with a focus on digital media and SEO',
    yearsOfExperience: 3,
    preferredLocation: 'Remote',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.REMOTE,
    preferredEmploymentArrangement: EmploymentArrangement.CONTRACT,
    minExpectedSalary: 2000000,
    maxExpectedSalary: 3500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[17], proficiency: 'ADVANCED', yearsExperience: 3 }, // Content
      { skillId: CONSTANT_IDS.SKILLS[9], proficiency: 'INTERMEDIATE', yearsExperience: 2 }, // Marketing
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[29],
    firstName: 'Musa',
    lastName: 'Yusuf',
    email: 'musa.yusuf@example.com',
    phoneNumber: '+2348000000029',
    address: 'Kaduna South, Kaduna',
    state: 'Kaduna',
    city: 'Kaduna',
    passwordHash,
    jobTitle: 'Electrician',
    brief: 'Licensed electrician with 10 years experience in residential wiring',
    yearsOfExperience: 10,
    preferredLocation: 'Kaduna',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 1800000,
    maxExpectedSalary: 2800000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[26], proficiency: 'ADVANCED', yearsExperience: 10 }, // Electrical
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[30],
    firstName: 'Nkem',
    lastName: 'Amadi',
    email: 'nkem.amadi@example.com',
    phoneNumber: '+2348000000030',
    address: '4 Aba, Abia',
    state: 'Abia',
    city: 'Aba',
    passwordHash,
    jobTitle: 'Supply Chain Coordinator',
    brief: 'Expert in inventory management and distribution logistics',
    yearsOfExperience: 5,
    preferredLocation: 'Umuahia',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.ON_SITE,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 3000000,
    maxExpectedSalary: 4500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[19], proficiency: 'ADVANCED', yearsExperience: 5 }, // Supply Chain
    ],
  },
  {
    id: CONSTANT_IDS.JOBSEEKERS[31],
    firstName: 'Ope',
    lastName: 'Salami',
    email: 'ope.salami@example.com',
    phoneNumber: '+2348000000031',
    address: '9 Oshogbo, Osun',
    state: 'Osun',
    city: 'Oshogbo',
    passwordHash,
    jobTitle: 'Financial Analyst',
    brief: 'Passionate about data modeling and investment analysis',
    yearsOfExperience: 4,
    preferredLocation: 'Lagos',
    preferredEmploymentType: EmploymentType.FULL_TIME,
    preferredWorkMode: WorkMode.HYBRID,
    preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
    minExpectedSalary: 4500000,
    maxExpectedSalary: 6500000,
    approvalStatus: ApprovalStatus.APPROVED,
    skills: [
      { skillId: CONSTANT_IDS.SKILLS[15], proficiency: 'ADVANCED', yearsExperience: 4 }, // Financial analysis
      { skillId: CONSTANT_IDS.SKILLS[14], proficiency: 'INTERMEDIATE', yearsExperience: 3 }, // Accounting
    ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[32],
     firstName: 'Patience',
     lastName: 'Udoh',
     email: 'patience.udoh@example.com',
     phoneNumber: '+2348000000032',
     address: 'Uyo, Akwa Ibom',
     state: 'Akwa Ibom',
     city: 'Uyo',
     passwordHash,
     jobTitle: 'Customer Service Lead',
     brief: 'Exceptional interpersonal skills with leadership experience in call centers',
     yearsOfExperience: 8,
     preferredLocation: 'Uyo',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 3500000,
     maxExpectedSalary: 5500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[11], proficiency: 'ADVANCED', yearsExperience: 8 }, // Customer Service
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 8 }, // Communication
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[33],
     firstName: 'Qudus',
     lastName: 'Aliyu',
     email: 'qudus.aliyu@example.com',
     phoneNumber: '+2348000000033',
     address: 'Ketu, Lagos',
     state: 'Lagos',
     city: 'Ikorodu',
     passwordHash,
     jobTitle: 'Fullstack Developer',
     brief: 'Versatile developer skilled in modern JavaScript frameworks and databases',
     yearsOfExperience: 3,
     preferredLocation: 'Lagos',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.REMOTE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 4500000,
     maxExpectedSalary: 7000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[0], proficiency: 'ADVANCED', yearsExperience: 3 }, // JS
       { skillId: CONSTANT_IDS.SKILLS[4], proficiency: 'INTERMEDIATE', yearsExperience: 2 }, // Node
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[34],
     firstName: 'Rita',
     lastName: 'Chukwu',
     email: 'rita.chukwu@example.com',
     phoneNumber: '+2348000000034',
     address: 'Isolo, Lagos',
     state: 'Lagos',
     city: 'Isolo',
     passwordHash,
     jobTitle: 'UX Researcher',
     brief: 'Human-centered designer with a master\'s degree in Cognitive Psychology',
     yearsOfExperience: 5,
     preferredLocation: 'Lagos',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.HYBRID,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 7000000,
     maxExpectedSalary: 9500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[12], proficiency: 'ADVANCED', yearsExperience: 5 }, // UI/UX
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 5 }, // Comm
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[35],
     firstName: 'Seyi',
     lastName: 'Olatunji',
     email: 'seyi.olatunji@example.com',
     phoneNumber: '+2348000000035',
     address: 'Ife Central, Osun',
     state: 'Osun',
     city: 'Ile-Ife',
     passwordHash,
     jobTitle: 'Data Analyst',
     brief: 'Data enthusiast passionate about uncovering insights using Python and SQL',
     yearsOfExperience: 2,
     preferredLocation: 'Remote',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.REMOTE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 3000000,
     maxExpectedSalary: 5000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[1], proficiency: 'ADVANCED', yearsExperience: 2 }, // Python
       { skillId: CONSTANT_IDS.SKILLS[10], proficiency: 'INTERMEDIATE', yearsExperience: 2 }, // Analytics
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[36],
     firstName: 'Tope',
     lastName: 'Balogun',
     email: 'tope.balogun@example.com',
     phoneNumber: '+2348000000036',
     address: 'Agege, Lagos',
     state: 'Lagos',
     city: 'Agege',
     passwordHash,
     jobTitle: 'System Administrator',
     brief: 'Windows and Linux server admin with extensive networking experience',
     yearsOfExperience: 9,
     preferredLocation: 'Lagos',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 6000000,
     maxExpectedSalary: 9000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[4], proficiency: 'ADVANCED', yearsExperience: 5 }, // Placeholder
       { skillId: CONSTANT_IDS.SKILLS[18], proficiency: 'ADVANCED', yearsExperience: 7 }, // Ops
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[37],
     firstName: 'Uche',
     lastName: 'Okeke',
     email: 'uche.okeke@example.com',
     phoneNumber: '+2348000000037',
     address: 'Onitsha, Anambra',
     state: 'Anambra',
     city: 'Onitsha',
     passwordHash,
     jobTitle: 'Marketing Executive',
     brief: 'Results-oriented marketer specialized in local brand awareness',
     yearsOfExperience: 6,
     preferredLocation: 'Onitsha',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 3500000,
     maxExpectedSalary: 5500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[9], proficiency: 'ADVANCED', yearsExperience: 6 }, // Marketing
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 6 }, // Communication
     ],
  },
  // --- Remaining 10 to complete the 30 ---
  {
     id: CONSTANT_IDS.JOBSEEKERS[38],
     firstName: 'Victoria',
     lastName: 'John',
     email: 'victoria.john@example.com',
     phoneNumber: '+2348000000038',
     address: 'Jos North, Plateau',
     state: 'Plateau',
     city: 'Jos',
     passwordHash,
     jobTitle: 'Graphic Artist',
     brief: 'Versatile artist skilled in both digital and hand-drawn illustrations',
     yearsOfExperience: 7,
     preferredLocation: 'Remote',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.REMOTE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 4000000,
     maxExpectedSalary: 6500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[13], proficiency: 'ADVANCED', yearsExperience: 7 }, // Graphics
       { skillId: CONSTANT_IDS.SKILLS[14], proficiency: 'INTERMEDIATE', yearsExperience: 2 }, // Placeholder
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[39],
     firstName: 'Wale',
     lastName: 'Ibrahim',
     email: 'wale.ibrahim@example.com',
     phoneNumber: '+2348000000039',
     address: 'Mushin, Lagos',
     state: 'Lagos',
     city: 'Mushin',
     passwordHash,
     jobTitle: 'Plumber',
     brief: 'Master plumber with expertise in industrial maintenance',
     yearsOfExperience: 12,
     preferredLocation: 'Lagos',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 2500000,
     maxExpectedSalary: 4500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[25], proficiency: 'ADVANCED', yearsExperience: 12 }, // Plumbing
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[40],
     firstName: 'Xavier',
     lastName: 'Opara',
     email: 'xavier.opara@example.com',
     phoneNumber: '+2348000000040',
     address: 'Owerri Municipal, Imo',
     state: 'Imo',
     city: 'Owerri',
     passwordHash,
     jobTitle: 'Quality Assurance Analyst',
     brief: 'Detail-focused QA engineer with expertise in automated testing pools',
     yearsOfExperience: 4,
     preferredLocation: 'Remote',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.REMOTE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 5000000,
     maxExpectedSalary: 7500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[3], proficiency: 'ADVANCED', yearsExperience: 4 }, // TS
       { skillId: CONSTANT_IDS.SKILLS[0], proficiency: 'ADVANCED', yearsExperience: 4 }, // JS
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[41],
     firstName: 'Yinka',
     lastName: 'Fadu',
     email: 'yinka.fadu@example.com',
     phoneNumber: '+2348000000041',
     address: 'Ketu, Lagos',
     state: 'Lagos',
     city: 'Ketu',
     passwordHash,
     jobTitle: 'Social Media Manager',
     brief: 'Creative thinker with a deep understanding of audience engagement',
     yearsOfExperience: 5,
     preferredLocation: 'Lagos',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.HYBRID,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 3000000,
     maxExpectedSalary: 5000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[9], proficiency: 'ADVANCED', yearsExperience: 5 }, // Marketing
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 5 }, // Comm
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[42],
     firstName: 'Zarah',
     lastName: 'Iliya',
     email: 'zarah.iliya@example.com',
     phoneNumber: '+2348000000042',
     address: 'Maitama, Abuja',
     state: 'FCT',
     city: 'Abuja',
     passwordHash,
     jobTitle: 'Legal Consultant',
     brief: 'Specialized in labor law and corporate compliance',
     yearsOfExperience: 8,
     preferredLocation: 'Abuja',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 9000000,
     maxExpectedSalary: 13000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[11], proficiency: 'ADVANCED', yearsExperience: 8 }, // Placeholder
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 8 }, // Comm
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[43],
     firstName: 'Amara',
     lastName: 'Chima',
     email: 'amara.chima@example.com',
     phoneNumber: '+2348000000043',
     address: 'Umuahia, Abia',
     state: 'Abia',
     city: 'Umuahia',
     passwordHash,
     jobTitle: 'Health & Safety Officer',
     brief: 'NEBOSH certified professional committed to workplace safety',
     yearsOfExperience: 10,
     preferredLocation: 'Port Harcourt',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 6000000,
     maxExpectedSalary: 8500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[18], proficiency: 'ADVANCED', yearsExperience: 10 }, // Placeholder for Safety
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[44],
     firstName: 'Bartholomew',
     lastName: 'Eze',
     email: 'barth.eze@example.com',
     phoneNumber: '+2348000000044',
     address: 'Enugu East, Enugu',
     state: 'Enugu',
     city: 'Enugu',
     passwordHash,
     jobTitle: 'Carpenter',
     brief: 'Skilled craftsman specializing in modern furniture design',
     yearsOfExperience: 15,
     preferredLocation: 'Enugu',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 3000000,
     maxExpectedSalary: 5000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[27], proficiency: 'ADVANCED', yearsExperience: 15 }, // Carpentry
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[45],
     firstName: 'Clementine',
     lastName: 'Okoro',
     email: 'clem.okoro@example.com',
     phoneNumber: '+2348000000045',
     address: 'Garki, Abuja',
     state: 'FCT',
     city: 'Abuja',
     passwordHash,
     jobTitle: 'Receptionist',
     brief: 'Professional and courteous front-desk officer with great communication skills',
     yearsOfExperience: 4,
     preferredLocation: 'Abuja',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 1800000,
     maxExpectedSalary: 2800000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[11], proficiency: 'ADVANCED', yearsExperience: 4 }, // Customer Service
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 4 }, // Communication
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[46],
     firstName: 'Donatus',
     lastName: 'Mbah',
     email: 'don.mbah@example.com',
     phoneNumber: '+2348000000046',
     address: 'Lekki Phase 2, Lagos',
     state: 'Lagos',
     city: 'Lekki',
     passwordHash,
     jobTitle: 'Security Supervisor',
     brief: 'Ex-military officer with expertise in perimeter security and surveillance',
     yearsOfExperience: 20,
     preferredLocation: 'Lagos',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 4500000,
     maxExpectedSalary: 7000000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[30], proficiency: 'ADVANCED', yearsExperience: 20 }, // Security
     ],
  },
  {
     id: CONSTANT_IDS.JOBSEEKERS[47],
     firstName: 'Evelyn',
     lastName: 'Peters',
     email: 'evelyn.peters@example.com',
     phoneNumber: '+2348000000047',
     address: 'Asokoro, Abuja',
     state: 'FCT',
     city: 'Abuja',
     passwordHash,
     jobTitle: 'Executive Assistant',
     brief: 'Highly organized professional with experience supporting C-level executives',
     yearsOfExperience: 10,
     preferredLocation: 'Abuja',
     preferredEmploymentType: EmploymentType.FULL_TIME,
     preferredWorkMode: WorkMode.ON_SITE,
     preferredEmploymentArrangement: EmploymentArrangement.PERMANENT_EMPLOYEE,
     minExpectedSalary: 6000000,
     maxExpectedSalary: 9500000,
     approvalStatus: ApprovalStatus.APPROVED,
     skills: [
       { skillId: CONSTANT_IDS.SKILLS[11], proficiency: 'ADVANCED', yearsExperience: 10 }, // CS as proxy
       { skillId: CONSTANT_IDS.SKILLS[21], proficiency: 'ADVANCED', yearsExperience: 10 }, // Comm
     ],
  },
];
