import { CONSTANT_IDS } from './constant.data';
import {
  ApprovalStatus,
  EmploymentType,
  EmploymentArrangement,
  WorkMode,
  SkillCategory,
} from '@app/common/database/entities/schema.enum';

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
    passwordHash:
      '$2a$12$LQv3c1yqBwrf8z/rjOAh4eG3i8F.EaTtLZ0eBWqz5d3J9Qx6lZ9nC',

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
];
