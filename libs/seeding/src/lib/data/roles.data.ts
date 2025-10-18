import { Permissions } from '@app/common/shared/enums/permissions.enum';

export enum ROLES_NAMES {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  VETTING_ADMIN = 'vetting_admin',
  PAYMENT_ADMIN = 'payment_admin',
}

/**
 * Default system roles seed data
 * These roles provide common permission groupings for JobStack
 */
export const SYSTEM_ROLES = [
  {
    id: '592f3161-cb68-4578-838e-3a351d509a4d',
    name: ROLES_NAMES.SUPER_ADMIN,
    description: 'Full system access with all permissions',
    permissions: Object.values(Permissions), // All permissions
  },

  {
    id: '7c18f32d-9c20-43d2-8440-0b829bb59a4e',
    name: ROLES_NAMES.ADMIN,
    description:
      'General admin with most permissions except system-critical ones',
    permissions: [
      // Admin Management (limited)
      Permissions.ADMIN_READ,
      Permissions.ADMIN_UPDATE,

      // Full Recruiter Management
      Permissions.RECRUITER_CREATE,
      Permissions.RECRUITER_READ,
      Permissions.RECRUITER_UPDATE,
      Permissions.RECRUITER_DELETE,

      // Full Jobseeker Management
      Permissions.JOBSEEKER_CREATE,
      Permissions.JOBSEEKER_READ,
      Permissions.JOBSEEKER_UPDATE,
      Permissions.JOBSEEKER_DELETE,

      // Vetting
      Permissions.VETTING_VIEW,
      Permissions.VETTING_UPDATE,

      // Jobs / Matching
      Permissions.JOB_CREATE,
      Permissions.JOB_READ,
      Permissions.JOB_UPDATE,
      Permissions.JOB_DELETE,
      Permissions.MATCH_RUN,

      // Payment viewing only
      Permissions.PAYMENT_VIEW,

      // Notifications
      Permissions.NOTIFICATION_SEND,
    ],
  },

  {
    id: 'f45cb240-dd2f-45cb-9ecc-261a3bc41b28',
    name: ROLES_NAMES.VETTING_ADMIN,
    description: 'Specialized admin focused on vetting and talent management',
    permissions: [
      // Jobseeker Management
      Permissions.JOBSEEKER_READ,
      Permissions.JOBSEEKER_UPDATE,

      // Full Vetting Access
      Permissions.VETTING_VIEW,
      Permissions.VETTING_UPDATE,

      // Job viewing for context
      Permissions.JOB_READ,

      // Matching for recommendations
      Permissions.MATCH_RUN,

      // Notifications
      Permissions.NOTIFICATION_SEND,
    ],
  },

  {
    id: 'ad1acbbb-89df-4572-bbbe-1ec9d187ce44',
    name: ROLES_NAMES.PAYMENT_ADMIN,
    description:
      'Specialized admin focused on payment and financial operations',
    permissions: [
      // Payment Management
      Permissions.PAYMENT_VIEW,
      Permissions.PAYMENT_REFUND,

      // View access for context
      Permissions.RECRUITER_READ,
      Permissions.JOBSEEKER_READ,
      Permissions.JOB_READ,

      // Notifications for payment updates
      Permissions.NOTIFICATION_SEND,
    ],
  },
];
