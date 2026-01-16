import {
  SkillCategory,
  SkillStatus,
} from '@app/common/database/entities/schema.enum';
import { CONSTANT_IDS } from './constant.data';

/**
 * System skills seed data
 * These are common skills for the Nigerian job market
 */
export const SYSTEM_SKILLS = [
  // Technical Skills
  {
    id: CONSTANT_IDS.SKILLS[0],
    name: 'JavaScript',
    description: 'Programming language for web development',
    synonyms: ['JS', 'ECMAScript', 'Node.js'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'TECHNICAL',
  },
  {
    id: CONSTANT_IDS.SKILLS[1],
    name: 'Python',
    description: 'High-level programming language',
    synonyms: ['Python3', 'Django', 'Flask'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'TECHNICAL',
  },
  {
    id: CONSTANT_IDS.SKILLS[2],
    name: 'React',
    description: 'JavaScript library for building user interfaces',
    synonyms: ['ReactJS', 'React.js'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'TECHNICAL',
  },
  {
    id: CONSTANT_IDS.SKILLS[3],
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    synonyms: ['TS'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'TECHNICAL',
  },
  {
    id: CONSTANT_IDS.SKILLS[4],
    name: 'Node.js',
    description: 'JavaScript runtime for server-side development',
    synonyms: ['NodeJS', 'Node'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'TECHNICAL',
  },

  // Database Skills
  {
    id: CONSTANT_IDS.SKILLS[5],
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    synonyms: ['Postgres', 'PSQL'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'SOFTWARE_DEVELOPMENT',
  },
  {
    id: CONSTANT_IDS.SKILLS[6],
    name: 'MySQL',
    description: 'Popular open-source relational database',
    synonyms: ['MySQL Server'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'SOFTWARE_DEVELOPMENT',
  },
  {
    id: CONSTANT_IDS.SKILLS[7],
    name: 'MongoDB',
    description: 'NoSQL document database',
    synonyms: ['Mongo'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'SOFTWARE_DEVELOPMENT',
  },

  // Business Skills
  {
    id: CONSTANT_IDS.SKILLS[8],
    name: 'Project Management',
    description: 'Planning and executing projects effectively',
    synonyms: ['PM', 'Agile', 'Scrum'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'BUSINESS',
  },
  {
    id: CONSTANT_IDS.SKILLS[9],
    name: 'Digital Marketing',
    description: 'Marketing products and services using digital channels',
    synonyms: ['Online Marketing', 'Internet Marketing'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'BUSINESS',
  },
  {
    id: CONSTANT_IDS.SKILLS[10],
    name: 'Data Analysis',
    description: 'Analyzing data to extract insights',
    synonyms: ['Analytics', 'Data Science'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'BUSINESS',
  },
  {
    id: CONSTANT_IDS.SKILLS[11],
    name: 'Customer Service',
    description: 'Providing support and assistance to customers',
    synonyms: ['Customer Support', 'Client Relations'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'BUSINESS',
  },

  // Design Skills
  {
    id: CONSTANT_IDS.SKILLS[12],
    name: 'UI/UX Design',
    description: 'User interface and user experience design',
    synonyms: ['User Experience', 'User Interface', 'Product Design'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'DESIGN',
  },
  {
    id: CONSTANT_IDS.SKILLS[13],
    name: 'Graphic Design',
    description: 'Visual communication and design',
    synonyms: ['Visual Design', 'Brand Design'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'DESIGN',
  },

  // Finance & Accounting
  {
    id: CONSTANT_IDS.SKILLS[14],
    name: 'Accounting',
    description: 'Financial record keeping and analysis',
    synonyms: ['Bookkeeping', 'Financial Accounting'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'FINANCE_ACCOUNTING',
  },
  {
    id: CONSTANT_IDS.SKILLS[15],
    name: 'Financial Analysis',
    description: 'Analyzing financial data and performance',
    synonyms: ['Financial Planning', 'Budget Analysis'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'FINANCE_ACCOUNTING',
  },

  // Sales & Marketing
  {
    id: CONSTANT_IDS.SKILLS[16],
    name: 'Sales',
    description: 'Selling products and services',
    synonyms: ['Business Development', 'Revenue Generation'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'SALES_MARKETING',
  },
  {
    id: CONSTANT_IDS.SKILLS[17],
    name: 'Content Marketing',
    description: 'Creating and distributing valuable content',
    synonyms: ['Content Creation', 'Content Strategy'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'SALES_MARKETING',
  },

  // Operations
  {
    id: CONSTANT_IDS.SKILLS[18],
    name: 'Operations Management',
    description: 'Managing business operations and processes',
    synonyms: ['Business Operations', 'Process Management'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'OPERATIONS',
  },
  {
    id: CONSTANT_IDS.SKILLS[19],
    name: 'Supply Chain Management',
    description: 'Managing supply chain and logistics',
    synonyms: ['Logistics', 'Procurement'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'OPERATIONS',
  },

  // Communication
  {
    id: CONSTANT_IDS.SKILLS[20],
    name: 'Communication',
    description: 'Effective verbal and written communication',
    synonyms: ['Public Speaking', 'Presentation Skills'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'COMMUNICATION',
  },
  {
    id: CONSTANT_IDS.SKILLS[21],
    name: 'English Language',
    description: 'Proficiency in English language',
    synonyms: ['English Proficiency', 'Business English'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HIGH_SKILL,
    subcategory: 'COMMUNICATION',
  },

  // Home Support & Domestic
  {
    id: CONSTANT_IDS.SKILLS[22],
    name: 'Housekeeping',
    description: 'Cleaning and maintaining living spaces',
    synonyms: ['Cleaning', 'Domestic Cleaning', 'Janitorial'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'HOME_SUPPORT',
  },
  {
    id: CONSTANT_IDS.SKILLS[23],
    name: 'Nanny & Childcare',
    description: 'Caring for infants and children in the home',
    synonyms: ['Childcare', 'Nanny', 'Babysitting'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'HOME_SUPPORT',
  },
  {
    id: CONSTANT_IDS.SKILLS[24],
    name: 'Domestic Assistance',
    description: 'General household help including errands and chores',
    synonyms: ['House Help', 'Domestic Staff'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'HOME_SUPPORT',
  },

  // Maintenance & Trades
  {
    id: CONSTANT_IDS.SKILLS[25],
    name: 'Plumbing',
    description: 'Installation and repair of water systems',
    synonyms: ['Pipe Fitting', 'Water Systems'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'MAINTENANCE_TRADES',
  },
  {
    id: CONSTANT_IDS.SKILLS[26],
    name: 'Electrical Repairs',
    description: 'Diagnosing and fixing electrical issues',
    synonyms: ['Electrician', 'Electrical Maintenance'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'MAINTENANCE_TRADES',
  },
  {
    id: CONSTANT_IDS.SKILLS[27],
    name: 'Carpentry',
    description: 'Woodwork construction and repairs',
    synonyms: ['Woodwork', 'Furniture Repairs'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'MAINTENANCE_TRADES',
  },
  {
    id: CONSTANT_IDS.SKILLS[28],
    name: 'Gardening & Landscaping',
    description: 'Maintaining outdoor spaces and lawns',
    synonyms: ['Gardening', 'Landscaping', 'Groundskeeping'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'MAINTENANCE_TRADES',
  },

  // Hospitality & Culinary
  {
    id: CONSTANT_IDS.SKILLS[29],
    name: 'Cooking',
    description: 'Preparing meals and managing kitchen duties',
    synonyms: ['Chef', 'Cook', 'Meal Preparation'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'HOSPITALITY',
  },
  {
    id: CONSTANT_IDS.SKILLS[30],
    name: 'Catering Services',
    description: 'Food preparation for events or offices',
    synonyms: ['Catering', 'Event Catering'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'HOSPITALITY',
  },

  // Security
  {
    id: CONSTANT_IDS.SKILLS[31],
    name: 'Security Guarding',
    description: 'Protecting property and people',
    synonyms: ['Security', 'Guard', 'Watchman'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'SECURITY',
  },
  {
    id: CONSTANT_IDS.SKILLS[32],
    name: 'Gatekeeping',
    description: 'Managing entry points and access control',
    synonyms: ['Gate Keeper', 'Access Control'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'SECURITY',
  },

  // Transport & Logistics
  {
    id: CONSTANT_IDS.SKILLS[33],
    name: 'Professional Driving',
    description: 'Driving company or personal vehicles safely',
    synonyms: ['Driver', 'Chauffeur'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'TRANSPORT_LOGISTICS',
  },
  {
    id: CONSTANT_IDS.SKILLS[34],
    name: 'Dispatch & Delivery',
    description: 'Handling deliveries and dispatch logistics',
    synonyms: ['Dispatch Rider', 'Logistics'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.LOW_SKILL,
    subcategory: 'TRANSPORT_LOGISTICS',
  },
];
