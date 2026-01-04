import { AdminRole } from '@app/common/shared/enums/roles.enum';
import * as bcrypt from 'bcryptjs';
import { CONSTANT_IDS } from './constant.data';

/**
 * Get super admin configuration from environment variables with fallbacks
 */
function getSuperAdminConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'enweremproper@gmail.com';
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
    id: CONSTANT_IDS.ADMINS[0],
    firstName: superAdminConfig.firstName,
    lastName: superAdminConfig.lastName,
    email: superAdminConfig.email,
    phoneNumber: '+2348010000001',
    address: 'Lagos, Nigeria',
    roleKey: AdminRole.SUPER_ADMIN.role,
    privilegeLevel: AdminRole.SUPER_ADMIN.privilegeLevel,
    passwordHash: superAdminConfig.password,
  },
  {
    id: CONSTANT_IDS.ADMINS[1],
    firstName: 'General',
    lastName: 'Admin',
    email: 'admin@jobstack.ng',
    phoneNumber: '+2348010000002',
    address: 'Lagos, Nigeria',
    roleKey: AdminRole.USER_MANAGEMENT.role,
    privilegeLevel: AdminRole.USER_MANAGEMENT.privilegeLevel,
    passwordHash: bcrypt.hashSync('password123', 12),
  },
  {
    id: CONSTANT_IDS.ADMINS[2],
    firstName: 'Vetting',
    lastName: 'Manager',
    email: 'vetting@jobstack.ng',
    phoneNumber: '+2348010000003',
    address: 'Lagos, Nigeria',
    roleKey: AdminRole.CONTENT_MODERATION.role,
    privilegeLevel: AdminRole.CONTENT_MODERATION.privilegeLevel,
    passwordHash: bcrypt.hashSync('password123', 12),
  },
  {
    id: CONSTANT_IDS.ADMINS[3],
    firstName: 'Payment',
    lastName: 'Admin',
    email: 'payments@jobstack.ng',
    phoneNumber: '+2348010000004',
    address: 'Lagos, Nigeria',
    roleKey: AdminRole.ANALYTICS.role,
    privilegeLevel: AdminRole.ANALYTICS.privilegeLevel,
    passwordHash: bcrypt.hashSync('password123', 12),
  },
];
