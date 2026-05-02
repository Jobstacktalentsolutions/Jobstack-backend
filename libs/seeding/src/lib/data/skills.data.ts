import { SkillStatus } from '@app/common/database/entities/schema.enum';
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
  },
  {
    id: CONSTANT_IDS.SKILLS[1],
    name: 'Python',
    description: 'High-level programming language',
    synonyms: ['Python3', 'Django', 'Flask'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[2],
    name: 'React',
    description: 'JavaScript library for building user interfaces',
    synonyms: ['ReactJS', 'React.js'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[3],
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    synonyms: ['TS'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[4],
    name: 'Node.js',
    description: 'JavaScript runtime for server-side development',
    synonyms: ['NodeJS', 'Node'],
    status: SkillStatus.ACTIVE,
  },

  // Database Skills
  {
    id: CONSTANT_IDS.SKILLS[5],
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    synonyms: ['Postgres', 'PSQL'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[6],
    name: 'MySQL',
    description: 'Popular open-source relational database',
    synonyms: ['MySQL Server'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[7],
    name: 'MongoDB',
    description: 'NoSQL document database',
    synonyms: ['Mongo'],
    status: SkillStatus.ACTIVE,
  },

  // Business Skills
  {
    id: CONSTANT_IDS.SKILLS[8],
    name: 'Project Management',
    description: 'Planning and executing projects effectively',
    synonyms: ['PM', 'Agile', 'Scrum'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[9],
    name: 'Digital Marketing',
    description: 'Marketing products and services using digital channels',
    synonyms: ['Online Marketing', 'Internet Marketing'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[10],
    name: 'Data Analysis',
    description: 'Analyzing data to extract insights',
    synonyms: ['Analytics', 'Data Science'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[11],
    name: 'Customer Service',
    description: 'Providing support and assistance to customers',
    synonyms: ['Customer Support', 'Client Relations'],
    status: SkillStatus.ACTIVE,
  },

  // Design Skills
  {
    id: CONSTANT_IDS.SKILLS[12],
    name: 'UI/UX Design',
    description: 'User interface and user experience design',
    synonyms: ['User Experience', 'User Interface', 'Product Design'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[13],
    name: 'Graphic Design',
    description: 'Visual communication and design',
    synonyms: ['Visual Design', 'Brand Design'],
    status: SkillStatus.ACTIVE,
  },

  // Finance & Accounting
  {
    id: CONSTANT_IDS.SKILLS[14],
    name: 'Accounting',
    description: 'Financial record keeping and analysis',
    synonyms: ['Bookkeeping', 'Financial Accounting'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[15],
    name: 'Financial Analysis',
    description: 'Analyzing financial data and performance',
    synonyms: ['Financial Planning', 'Budget Analysis'],
    status: SkillStatus.ACTIVE,
  },

  // Sales & Marketing
  {
    id: CONSTANT_IDS.SKILLS[16],
    name: 'Sales',
    description: 'Selling products and services',
    synonyms: ['Business Development', 'Revenue Generation'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[17],
    name: 'Content Marketing',
    description: 'Creating and distributing valuable content',
    synonyms: ['Content Creation', 'Content Strategy'],
    status: SkillStatus.ACTIVE,
  },

  // Operations
  {
    id: CONSTANT_IDS.SKILLS[18],
    name: 'Operations Management',
    description: 'Managing business operations and processes',
    synonyms: ['Business Operations', 'Process Management'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[19],
    name: 'Supply Chain Management',
    description: 'Managing supply chain and logistics',
    synonyms: ['Logistics', 'Procurement'],
    status: SkillStatus.ACTIVE,
  },

  // Communication
  {
    id: CONSTANT_IDS.SKILLS[20],
    name: 'Communication',
    description: 'Effective verbal and written communication',
    synonyms: ['Public Speaking', 'Presentation Skills'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[21],
    name: 'English Language',
    description: 'Proficiency in English language',
    synonyms: ['English Proficiency', 'Business English'],
    status: SkillStatus.ACTIVE,
  },

  // Home Support & Domestic
  {
    id: CONSTANT_IDS.SKILLS[22],
    name: 'Housekeeping',
    description: 'Cleaning and maintaining living spaces',
    synonyms: ['Cleaning', 'Domestic Cleaning', 'Janitorial'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[23],
    name: 'Nanny & Childcare',
    description: 'Caring for infants and children in the home',
    synonyms: ['Childcare', 'Nanny', 'Babysitting'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[24],
    name: 'Domestic Assistance',
    description: 'General household help including errands and chores',
    synonyms: ['House Help', 'Domestic Staff'],
    status: SkillStatus.ACTIVE,
  },

  // Maintenance & Trades
  {
    id: CONSTANT_IDS.SKILLS[25],
    name: 'Plumbing',
    description: 'Installation and repair of water systems',
    synonyms: ['Pipe Fitting', 'Water Systems'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[26],
    name: 'Electrical Repairs',
    description: 'Diagnosing and fixing electrical issues',
    synonyms: ['Electrician', 'Electrical Maintenance'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[27],
    name: 'Carpentry',
    description: 'Woodwork construction and repairs',
    synonyms: ['Woodwork', 'Furniture Repairs'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[28],
    name: 'Gardening & Landscaping',
    description: 'Maintaining outdoor spaces and lawns',
    synonyms: ['Gardening', 'Landscaping', 'Groundskeeping'],
    status: SkillStatus.ACTIVE,
  },

  // Hospitality & Culinary
  {
    id: CONSTANT_IDS.SKILLS[29],
    name: 'Cooking',
    description: 'Preparing meals and managing kitchen duties',
    synonyms: ['Chef', 'Cook', 'Meal Preparation'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[30],
    name: 'Catering Services',
    description: 'Food preparation for events or offices',
    synonyms: ['Catering', 'Event Catering'],
    status: SkillStatus.ACTIVE,
  },

  // Security
  {
    id: CONSTANT_IDS.SKILLS[31],
    name: 'Security Guarding',
    description: 'Protecting property and people',
    synonyms: ['Security', 'Guard', 'Watchman'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[32],
    name: 'Gatekeeping',
    description: 'Managing entry points and access control',
    synonyms: ['Gate Keeper', 'Access Control'],
    status: SkillStatus.ACTIVE,
  },

  // Transport & Logistics
  {
    id: CONSTANT_IDS.SKILLS[33],
    name: 'Professional Driving',
    description: 'Driving company or personal vehicles safely',
    synonyms: ['Driver', 'Chauffeur'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[34],
    name: 'Dispatch & Delivery',
    description: 'Handling deliveries and dispatch logistics',
    synonyms: ['Dispatch Rider', 'Logistics'],
    status: SkillStatus.ACTIVE,
  },
  // Pet Care
  {
    id: CONSTANT_IDS.SKILLS[35],
    name: 'Dog Walking',
    description: 'Walking and caring for dogs',
    synonyms: ['Dog Walker', 'Pet Walking'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[36],
    name: 'Pet Sitting',
    description: 'In-home care for pets while owners are away',
    synonyms: ['Pet Care', 'Pet Minder'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[37],
    name: 'Pet Grooming',
    description: 'Bathing, trimming, and grooming pets',
    synonyms: ['Dog Grooming', 'Animal Grooming'],
    status: SkillStatus.ACTIVE,
  },

  // Personal Services
  {
    id: CONSTANT_IDS.SKILLS[38],
    name: 'Hair Styling',
    description: 'Styling and maintaining hair for clients',
    synonyms: ['Hairdressing', 'Hair Styling'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[39],
    name: 'Barbering',
    description: 'Hair cutting and grooming services for clients',
    synonyms: ['Barber', 'Hair Cutting'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[40],
    name: 'Makeup Artistry',
    description: 'Professional makeup application for clients',
    synonyms: ['Makeup Artist', 'Cosmetics'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[41],
    name: 'Tailoring & Alterations',
    description: 'Clothing alterations and custom tailoring',
    synonyms: ['Tailoring', 'Alterations', 'Seamstress'],
    status: SkillStatus.ACTIVE,
  },

  // Retail & Merchandising
  {
    id: CONSTANT_IDS.SKILLS[42],
    name: 'Cash Handling',
    description: 'Managing cash transactions and daily totals',
    synonyms: ['Cashier', 'Till Operations'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[43],
    name: 'POS Operations',
    description: 'Operating point-of-sale systems and terminals',
    synonyms: ['Point of Sale', 'POS'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[44],
    name: 'Shelf Stocking',
    description: 'Stocking shelves and maintaining product displays',
    synonyms: ['Stocking', 'Merchandising'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[45],
    name: 'Retail Sales Assistance',
    description: 'Assisting customers and supporting sales on the floor',
    synonyms: ['Sales Associate', 'Shop Assistant'],
    status: SkillStatus.ACTIVE,
  },

  // Event Services
  {
    id: CONSTANT_IDS.SKILLS[46],
    name: 'Event Setup & Breakdown',
    description: 'Setting up and packing down event spaces',
    synonyms: ['Event Setup', 'Event Crew'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: CONSTANT_IDS.SKILLS[47],
    name: 'Ushering & Guest Support',
    description: 'Guiding guests and supporting event operations',
    synonyms: ['Usher', 'Guest Services'],
    status: SkillStatus.ACTIVE,
  },

  // Culinary
  {
    id: CONSTANT_IDS.SKILLS[48],
    name: 'Chef',
    description: 'Menu planning and kitchen leadership',
    synonyms: ['Head Chef', 'Cook'],
    status: SkillStatus.ACTIVE,
  },
];
