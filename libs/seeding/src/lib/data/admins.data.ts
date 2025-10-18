import * as bcrypt from 'bcryptjs';
import { SYSTEM_ROLES, ROLES_NAMES } from './roles.data';
const passwordHash = bcrypt.hashSync('password123', 12);

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

// Get super admin config from environment
export const superAdminConfig = getSuperAdminConfig();

export const ADMINS_DATA = [
  {
    id: '0ac5f27e-95b0-48cc-8151-184610ba7dd6',
    // Profile data
    firstName: superAdminConfig.firstName,
    lastName: superAdminConfig.lastName,
    email: superAdminConfig.email,
    phoneNumber: '+2348010000001',
    address: 'Lagos, Nigeria',

    // Role assignment
    roleId: SYSTEM_ROLES.find((role) => role.name === ROLES_NAMES.SUPER_ADMIN)
      ?.id, // super admin role

    // Auth data (will be handled by auth seeding if needed)
    passwordHash: superAdminConfig.password,
  },
  {
    id: 'a179101b-12ca-450e-a92b-ba4e9701f857',
    // Profile data
    firstName: 'General',
    lastName: 'Admin',
    email: 'admin@jobstack.ng',
    phoneNumber: '+2348010000002',
    address: 'Lagos, Nigeria',

    // Role assignment
    roleId: SYSTEM_ROLES.find((role) => role.name === ROLES_NAMES.ADMIN)?.id, // general admin role

    // Auth data
    passwordHash,
  },
  {
    id: 'f45cb240-dd2f-45cb-9ecc-261a3bc41b28',
    // Profile data
    firstName: 'Vetting',
    lastName: 'Manager',
    email: 'vetting@jobstack.ng',
    phoneNumber: '+2348010000003',
    address: 'Lagos, Nigeria',

    // Role assignment
    roleId: SYSTEM_ROLES.find((role) => role.name === ROLES_NAMES.VETTING_ADMIN)
      ?.id, // vetting admin role

    // Auth data
    passwordHash,
  },
  {
    id: 'ad1acbbb-89df-4572-bbbe-1ec9d187ce44',
    // Profile data
    firstName: 'Payment',
    lastName: 'Admin',
    email: 'payments@jobstack.ng',
    phoneNumber: '+2348010000004',
    address: 'Lagos, Nigeria',

    // Role assignment
    roleId: SYSTEM_ROLES.find((role) => role.name === ROLES_NAMES.PAYMENT_ADMIN)
      ?.id, // payment admin role

    // Auth data
    passwordHash,
  },
];
