import {
  SkillCategory,
  SkillStatus,
} from '@app/common/database/entities/schema.enum';

/**
 * System skills seed data
 * These are common skills for the Nigerian job market
 */
export const SYSTEM_SKILLS = [
  // Technical Skills
  {
    id: 'f68bfed3-33f6-44b9-a8aa-efde5a9bf5c8',
    name: 'JavaScript',
    description: 'Programming language for web development',
    synonyms: ['JS', 'ECMAScript', 'Node.js'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TECHNICAL,
  },
  {
    id: '98b09407-9e69-4bee-a0cb-3a8d1255a781',
    name: 'Python',
    description: 'High-level programming language',
    synonyms: ['Python3', 'Django', 'Flask'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TECHNICAL,
  },
  {
    id: 'd0cc06bf-1b94-491a-b63c-2d8cea20620f',
    name: 'React',
    description: 'JavaScript library for building user interfaces',
    synonyms: ['ReactJS', 'React.js'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TECHNICAL,
  },
  {
    id: 'b9bd83cc-87c2-48ad-9434-9c9e299ad159',
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    synonyms: ['TS'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TECHNICAL,
  },
  {
    id: 'a2cc96ed-9d87-4e8d-8d4b-2e7c64caf463',
    name: 'Node.js',
    description: 'JavaScript runtime for server-side development',
    synonyms: ['NodeJS', 'Node'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TECHNICAL,
  },

  // Database Skills
  {
    id: '217e791e-451a-4dec-8701-a036db7dc016',
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    synonyms: ['Postgres', 'PSQL'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SOFTWARE_DEVELOPMENT,
  },
  {
    id: '671f6c9c-6a17-44d6-a82a-2f467c3a1ba9',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    synonyms: ['MySQL Server'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SOFTWARE_DEVELOPMENT,
  },
  {
    id: 'e5da1140-4ad0-4d5d-bbbf-ab2c6db078fb',
    name: 'MongoDB',
    description: 'NoSQL document database',
    synonyms: ['Mongo'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SOFTWARE_DEVELOPMENT,
  },

  // Business Skills
  {
    id: '4210245d-9eff-48fd-aecb-7aa2b244aa45',
    name: 'Project Management',
    description: 'Planning and executing projects effectively',
    synonyms: ['PM', 'Agile', 'Scrum'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.BUSINESS,
  },
  {
    id: '669243d9-00e5-4590-a923-d3f1a5d86cb9',
    name: 'Digital Marketing',
    description: 'Marketing products and services using digital channels',
    synonyms: ['Online Marketing', 'Internet Marketing'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.BUSINESS,
  },
  {
    id: '98f2e444-2b43-436b-8f70-920d5d6b0df7',
    name: 'Data Analysis',
    description: 'Analyzing data to extract insights',
    synonyms: ['Analytics', 'Data Science'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.BUSINESS,
  },
  {
    id: 'ca10a12b-986e-481c-8e55-c9a4e790c832',
    name: 'Customer Service',
    description: 'Providing support and assistance to customers',
    synonyms: ['Customer Support', 'Client Relations'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.BUSINESS,
  },

  // Design Skills
  {
    id: '8cdb7ec5-753a-4661-8d16-b1cd1fcadacb',
    name: 'UI/UX Design',
    description: 'User interface and user experience design',
    synonyms: ['User Experience', 'User Interface', 'Product Design'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.DESIGN,
  },
  {
    id: 'e3df7de6-63ff-48bb-98cd-4d9b56f240fc',
    name: 'Graphic Design',
    description: 'Visual communication and design',
    synonyms: ['Visual Design', 'Brand Design'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.DESIGN,
  },

  // Finance & Accounting
  {
    id: '63adabe6-f542-4e8c-94e1-674a689c5423',
    name: 'Accounting',
    description: 'Financial record keeping and analysis',
    synonyms: ['Bookkeeping', 'Financial Accounting'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.FINANCE_ACCOUNTING,
  },
  {
    id: 'fdf90110-f5bf-468f-ab70-0a40c6263143',
    name: 'Financial Analysis',
    description: 'Analyzing financial data and performance',
    synonyms: ['Financial Planning', 'Budget Analysis'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.FINANCE_ACCOUNTING,
  },

  // Sales & Marketing
  {
    id: 'd9e74e9f-0e02-4ca6-983d-75f2e7b48c70',
    name: 'Sales',
    description: 'Selling products and services',
    synonyms: ['Business Development', 'Revenue Generation'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SALES_MARKETING,
  },
  {
    id: '7a431261-d85d-4b82-8157-ba99b8d6f619',
    name: 'Content Marketing',
    description: 'Creating and distributing valuable content',
    synonyms: ['Content Creation', 'Content Strategy'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SALES_MARKETING,
  },

  // Operations
  {
    id: 'c1c4b46f-fab2-4bd5-b03a-d61d3b191184',
    name: 'Operations Management',
    description: 'Managing business operations and processes',
    synonyms: ['Business Operations', 'Process Management'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.OPERATIONS,
  },
  {
    id: 'af9ce93f-434d-4b09-892e-9b295cde0f8e',
    name: 'Supply Chain Management',
    description: 'Managing supply chain and logistics',
    synonyms: ['Logistics', 'Procurement'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.OPERATIONS,
  },

  // Communication
  {
    id: '751cef49-dc45-426d-bd80-15ccc767ba36',
    name: 'Communication',
    description: 'Effective verbal and written communication',
    synonyms: ['Public Speaking', 'Presentation Skills'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.COMMUNICATION,
  },
  {
    id: '66a128ff-14c7-4101-b7ab-86e7b34f85b1',
    name: 'English Language',
    description: 'Proficiency in English language',
    synonyms: ['English Proficiency', 'Business English'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.COMMUNICATION,
  },

  // Home Support & Domestic
  {
    id: '2bfd7534-0285-4db2-a10a-7bd26feefc63',
    name: 'Housekeeping',
    description: 'Cleaning and maintaining living spaces',
    synonyms: ['Cleaning', 'Domestic Cleaning', 'Janitorial'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HOME_SUPPORT,
  },
  {
    id: '63d54c6a-f4ad-4a96-af39-1e04a56c34d0',
    name: 'Nanny & Childcare',
    description: 'Caring for infants and children in the home',
    synonyms: ['Childcare', 'Nanny', 'Babysitting'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HOME_SUPPORT,
  },
  {
    id: '8b91e38f-3050-4eb0-8c7a-fdfea4b9f8d9',
    name: 'Domestic Assistance',
    description: 'General household help including errands and chores',
    synonyms: ['House Help', 'Domestic Staff'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HOME_SUPPORT,
  },

  // Maintenance & Trades
  {
    id: '4a4242bb-7199-4c74-8dd5-399fd6381c1d',
    name: 'Plumbing',
    description: 'Installation and repair of water systems',
    synonyms: ['Pipe Fitting', 'Water Systems'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.MAINTENANCE_TRADES,
  },
  {
    id: 'a95f5a5c-ef32-48c1-90bb-1190462fe0a2',
    name: 'Electrical Repairs',
    description: 'Diagnosing and fixing electrical issues',
    synonyms: ['Electrician', 'Electrical Maintenance'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.MAINTENANCE_TRADES,
  },
  {
    id: '1f0fb1d3-22e7-4580-8f9a-09ec72c036b5',
    name: 'Carpentry',
    description: 'Woodwork construction and repairs',
    synonyms: ['Woodwork', 'Furniture Repairs'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.MAINTENANCE_TRADES,
  },
  {
    id: '0c4cbadb-5069-4a8f-9b27-0e7d6b6c9ae0',
    name: 'Gardening & Landscaping',
    description: 'Maintaining outdoor spaces and lawns',
    synonyms: ['Gardening', 'Landscaping', 'Groundskeeping'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.MAINTENANCE_TRADES,
  },

  // Hospitality & Culinary
  {
    id: '3f7fe705-3edf-4aa4-ae5e-0e9d1fd34c55',
    name: 'Cooking',
    description: 'Preparing meals and managing kitchen duties',
    synonyms: ['Chef', 'Cook', 'Meal Preparation'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HOSPITALITY,
  },
  {
    id: 'f0aab7b8-7c73-4418-8322-6979d1582b13',
    name: 'Catering Services',
    description: 'Food preparation for events or offices',
    synonyms: ['Catering', 'Event Catering'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.HOSPITALITY,
  },

  // Security
  {
    id: '6d1bc3a8-6772-4e3e-8a2d-2288fbb45818',
    name: 'Security Guarding',
    description: 'Protecting property and people',
    synonyms: ['Security', 'Guard', 'Watchman'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SECURITY,
  },
  {
    id: 'd36d0652-9a6f-4319-b0a0-db614717822c',
    name: 'Gatekeeping',
    description: 'Managing entry points and access control',
    synonyms: ['Gate Keeper', 'Access Control'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.SECURITY,
  },

  // Transport & Logistics
  {
    id: 'b7bf4250-50b0-4d4a-9b7e-0b99a2cbf79c',
    name: 'Professional Driving',
    description: 'Driving company or personal vehicles safely',
    synonyms: ['Driver', 'Chauffeur'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TRANSPORT_LOGISTICS,
  },
  {
    id: 'b9e25d01-6471-4f02-8ff3-b1a0d0ab5061',
    name: 'Dispatch & Delivery',
    description: 'Handling deliveries and dispatch logistics',
    synonyms: ['Dispatch Rider', 'Logistics'],
    status: SkillStatus.ACTIVE,
    category: SkillCategory.TRANSPORT_LOGISTICS,
  },
];
