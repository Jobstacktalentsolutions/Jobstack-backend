import { Permissions } from '@app/common/shared/enums/permissions.enum';

/**
 * System permissions seed data
 * These are the fixed permissions that developers define
 */
export const SYSTEM_PERMISSIONS: {
  id: string;
  name: string;
  key: Permissions;
  description: string;
}[] = [
  // Admin Management
  {
    id: 'f68bfed3-33f6-44b9-a8aa-efde5a9bf5c8',
    name: 'Create Admins',
    key: Permissions.ADMIN_CREATE,
    description: 'Create new admin accounts',
  },
  {
    id: '98b09407-9e69-4bee-a0cb-3a8d1255a781',
    name: 'View Admins',
    key: Permissions.ADMIN_READ,
    description: 'View admin account information',
  },
  {
    id: 'd0cc06bf-1b94-491a-b63c-2d8cea20620f',
    name: 'Update Admins',
    key: Permissions.ADMIN_UPDATE,
    description: 'Update admin account information',
  },
  {
    id: 'b9bd83cc-87c2-48ad-9434-9c9e299ad159',
    name: 'Delete Admins',
    key: Permissions.ADMIN_DELETE,
    description: 'Delete admin accounts',
  },

  // Recruiter Management
  {
    id: 'a2cc96ed-9d87-4e8d-8d4b-2e7c64caf463',
    name: 'Create Recruiters',
    key: Permissions.RECRUITER_CREATE,
    description: 'Create new recruiter accounts',
  },
  {
    id: '217e791e-451a-4dec-8701-a036db7dc016',
    name: 'View Recruiters',
    key: Permissions.RECRUITER_READ,
    description: 'View recruiter account information',
  },
  {
    id: '671f6c9c-6a17-44d6-a82a-2f467c3a1ba9',
    name: 'Update Recruiters',
    key: Permissions.RECRUITER_UPDATE,
    description: 'Update recruiter account information',
  },
  {
    id: 'e5da1140-4ad0-4d5d-bbbf-ab2c6db078fb',
    name: 'Delete Recruiters',
    key: Permissions.RECRUITER_DELETE,
    description: 'Delete recruiter accounts',
  },

  // Jobseeker Management
  {
    id: '4210245d-9eff-48fd-aecb-7aa2b244aa45',
    name: 'Create Jobseekers',
    key: Permissions.JOBSEEKER_CREATE,
    description: 'Create new jobseeker accounts',
  },
  {
    id: '669243d9-00e5-4590-a923-d3f1a5d86cb9',
    name: 'View Jobseekers',
    key: Permissions.JOBSEEKER_READ,
    description: 'View jobseeker account information',
  },
  {
    id: '98f2e444-2b43-436b-8f70-920d5d6b0df7',
    name: 'Update Jobseekers',
    key: Permissions.JOBSEEKER_UPDATE,
    description: 'Update jobseeker account information',
  },
  {
    id: 'ca10a12b-986e-481c-8e55-c9a4e790c832',
    name: 'Delete Jobseekers',
    key: Permissions.JOBSEEKER_DELETE,
    description: 'Delete jobseeker accounts',
  },

  // Vetting
  {
    id: '8cdb7ec5-753a-4661-8d16-b1cd1fcadacb',
    name: 'View Vetting',
    key: Permissions.VETTING_VIEW,
    description: 'View jobseeker vetting status and documents',
  },
  {
    id: 'e3df7de6-63ff-48bb-98cd-4d9b56f240fc',
    name: 'Update Vetting',
    key: Permissions.VETTING_UPDATE,
    description: 'Update jobseeker vetting status and documents',
  },

  // Jobs / Matching
  {
    id: '63adabe6-f542-4e8c-94e1-674a689c5423',
    name: 'Create Jobs',
    key: Permissions.JOB_CREATE,
    description: 'Create new job postings',
  },
  {
    id: 'fdf90110-f5bf-468f-ab70-0a40c6263143',
    name: 'View Jobs',
    key: Permissions.JOB_READ,
    description: 'View job postings and details',
  },
  {
    id: 'd9e74e9f-0e02-4ca6-983d-75f2e7b48c70',
    name: 'Update Jobs',
    key: Permissions.JOB_UPDATE,
    description: 'Update job postings and details',
  },
  {
    id: '7a431261-d85d-4b82-8157-ba99b8d6f619',
    name: 'Delete Jobs',
    key: Permissions.JOB_DELETE,
    description: 'Delete job postings',
  },
  {
    id: 'c1c4b46f-fab2-4bd5-b03a-d61d3b191184',
    name: 'Run Matching',
    key: Permissions.MATCH_RUN,
    description: 'Run the smart matching algorithm',
  },

  // Payments
  {
    id: 'af9ce93f-434d-4b09-892e-9b295cde0f8e',
    name: 'View Payments',
    key: Permissions.PAYMENT_VIEW,
    description: 'View payment transactions and history',
  },
  {
    id: '751cef49-dc45-426d-bd80-15ccc767ba36',
    name: 'Refund Payments',
    key: Permissions.PAYMENT_REFUND,
    description: 'Process payment refunds',
  },

  // Notifications
  {
    id: '66a128ff-14c7-4101-b7ab-86e7b34f85b1',
    name: 'Send Notifications',
    key: Permissions.NOTIFICATION_SEND,
    description: 'Send notifications to users',
  },
];
