import { SkillStatus } from '@app/common/database/entities/Skill.entity';

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
  },
  {
    id: '98b09407-9e69-4bee-a0cb-3a8d1255a781',
    name: 'Python',
    description: 'High-level programming language',
    synonyms: ['Python3', 'Django', 'Flask'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'd0cc06bf-1b94-491a-b63c-2d8cea20620f',
    name: 'React',
    description: 'JavaScript library for building user interfaces',
    synonyms: ['ReactJS', 'React.js'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'b9bd83cc-87c2-48ad-9434-9c9e299ad159',
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    synonyms: ['TS'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'a2cc96ed-9d87-4e8d-8d4b-2e7c64caf463',
    name: 'Node.js',
    description: 'JavaScript runtime for server-side development',
    synonyms: ['NodeJS', 'Node'],
    status: SkillStatus.ACTIVE,
  },

  // Database Skills
  {
    id: '217e791e-451a-4dec-8701-a036db7dc016',
    name: 'PostgreSQL',
    description: 'Advanced open-source relational database',
    synonyms: ['Postgres', 'PSQL'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: '671f6c9c-6a17-44d6-a82a-2f467c3a1ba9',
    name: 'MySQL',
    description: 'Popular open-source relational database',
    synonyms: ['MySQL Server'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'e5da1140-4ad0-4d5d-bbbf-ab2c6db078fb',
    name: 'MongoDB',
    description: 'NoSQL document database',
    synonyms: ['Mongo'],
    status: SkillStatus.ACTIVE,
  },

  // Business Skills
  {
    id: '4210245d-9eff-48fd-aecb-7aa2b244aa45',
    name: 'Project Management',
    description: 'Planning and executing projects effectively',
    synonyms: ['PM', 'Agile', 'Scrum'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: '669243d9-00e5-4590-a923-d3f1a5d86cb9',
    name: 'Digital Marketing',
    description: 'Marketing products and services using digital channels',
    synonyms: ['Online Marketing', 'Internet Marketing'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: '98f2e444-2b43-436b-8f70-920d5d6b0df7',
    name: 'Data Analysis',
    description: 'Analyzing data to extract insights',
    synonyms: ['Analytics', 'Data Science'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'ca10a12b-986e-481c-8e55-c9a4e790c832',
    name: 'Customer Service',
    description: 'Providing support and assistance to customers',
    synonyms: ['Customer Support', 'Client Relations'],
    status: SkillStatus.ACTIVE,
  },

  // Design Skills
  {
    id: '8cdb7ec5-753a-4661-8d16-b1cd1fcadacb',
    name: 'UI/UX Design',
    description: 'User interface and user experience design',
    synonyms: ['User Experience', 'User Interface', 'Product Design'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'e3df7de6-63ff-48bb-98cd-4d9b56f240fc',
    name: 'Graphic Design',
    description: 'Visual communication and design',
    synonyms: ['Visual Design', 'Brand Design'],
    status: SkillStatus.ACTIVE,
  },

  // Finance & Accounting
  {
    id: '63adabe6-f542-4e8c-94e1-674a689c5423',
    name: 'Accounting',
    description: 'Financial record keeping and analysis',
    synonyms: ['Bookkeeping', 'Financial Accounting'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'fdf90110-f5bf-468f-ab70-0a40c6263143',
    name: 'Financial Analysis',
    description: 'Analyzing financial data and performance',
    synonyms: ['Financial Planning', 'Budget Analysis'],
    status: SkillStatus.ACTIVE,
  },

  // Sales & Marketing
  {
    id: 'd9e74e9f-0e02-4ca6-983d-75f2e7b48c70',
    name: 'Sales',
    description: 'Selling products and services',
    synonyms: ['Business Development', 'Revenue Generation'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: '7a431261-d85d-4b82-8157-ba99b8d6f619',
    name: 'Content Marketing',
    description: 'Creating and distributing valuable content',
    synonyms: ['Content Creation', 'Content Strategy'],
    status: SkillStatus.ACTIVE,
  },

  // Operations
  {
    id: 'c1c4b46f-fab2-4bd5-b03a-d61d3b191184',
    name: 'Operations Management',
    description: 'Managing business operations and processes',
    synonyms: ['Business Operations', 'Process Management'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: 'af9ce93f-434d-4b09-892e-9b295cde0f8e',
    name: 'Supply Chain Management',
    description: 'Managing supply chain and logistics',
    synonyms: ['Logistics', 'Procurement'],
    status: SkillStatus.ACTIVE,
  },

  // Communication
  {
    id: '751cef49-dc45-426d-bd80-15ccc767ba36',
    name: 'Communication',
    description: 'Effective verbal and written communication',
    synonyms: ['Public Speaking', 'Presentation Skills'],
    status: SkillStatus.ACTIVE,
  },
  {
    id: '66a128ff-14c7-4101-b7ab-86e7b34f85b1',
    name: 'English Language',
    description: 'Proficiency in English language',
    synonyms: ['English Proficiency', 'Business English'],
    status: SkillStatus.ACTIVE,
  },
];
