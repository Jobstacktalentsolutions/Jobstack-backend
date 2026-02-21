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
];
