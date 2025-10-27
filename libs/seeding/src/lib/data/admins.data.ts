import { AdminRole } from '@app/common/shared/enums/roles.enum';
import * as bcrypt from 'bcryptjs';

/**
 * Get super admin configuration from environment variables with fallbacks
 */
function getSuperAdminConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@jobstack.ng';
  const password = bcrypt.hashSync(
    process.env.SUPER_ADMIN_PASSWORD || 'admin123',
    12,
  );
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  return {
    email,
    password,
    firstName,
    lastName,
  };
}

export const superAdminConfig = getSuperAdminConfig();

export const ADMINS_DATA = [
  {
    id: '0ac5f27e-95b0-48cc-8151-184610ba7dd6',
    firstName: superAdminConfig.firstName,
    lastName: superAdminConfig.lastName,
    email: superAdminConfig.email,
    phoneNumber: '+2348010000001',
    address: 'Lagos, Nigeria',
    roleKey: 'SUPER_ADMIN',
    privilegeLevel: AdminRole.SUPER_ADMIN.privilegeLevel,
    passwordHash: superAdminConfig.password,
  },
  {
    id: 'a179101b-12ca-450e-a92b-ba4e9701f857',
    firstName: 'General',
    lastName: 'Admin',
    email: 'admin@jobstack.ng',
    phoneNumber: '+2348010000002',
    address: 'Lagos, Nigeria',
    roleKey: 'USER_MANAGEMENT',
    privilegeLevel: AdminRole.USER_MANAGEMENT.privilegeLevel,
    passwordHash: bcrypt.hashSync('password123', 12),
  },
  {
    id: 'f45cb240-dd2f-45cb-9ecc-261a3bc41b28',
    firstName: 'Vetting',
    lastName: 'Manager',
    email: 'vetting@jobstack.ng',
    phoneNumber: '+2348010000003',
    address: 'Lagos, Nigeria',
    roleKey: 'CONTENT_MODERATION',
    privilegeLevel: AdminRole.CONTENT_MODERATION.privilegeLevel,
    passwordHash: bcrypt.hashSync('password123', 12),
  },
  {
    id: 'ad1acbbb-89df-4572-bbbe-1ec9d187ce44',
    firstName: 'Payment',
    lastName: 'Admin',
    email: 'payments@jobstack.ng',
    phoneNumber: '+2348010000004',
    address: 'Lagos, Nigeria',
    roleKey: 'ANALYTICS',
    privilegeLevel: AdminRole.ANALYTICS.privilegeLevel,
    passwordHash: bcrypt.hashSync('password123', 12),
  },
];
