import { AdminRole } from '@app/common/shared/enums/roles.enum';
import * as bcrypt from 'bcryptjs';
import { CONSTANT_IDS } from './constant.data';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Get super admin configuration from environment variables with fallbacks
 */
function getSuperAdminConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME;
  const lastName = process.env.SUPER_ADMIN_LAST_NAME;

  if (!email || !password || !firstName || !lastName) {
    console.error({ email, password, firstName, lastName });
    throw new Error('Super admin configuration is missing');
  }
  const passwordHash = bcrypt.hashSync(password, 12);
  return {
    email,
    password: passwordHash,
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

    roleKey: AdminRole.SUPER_ADMIN.role,
    privilegeLevel: AdminRole.SUPER_ADMIN.privilegeLevel,
    passwordHash: superAdminConfig.password,
  },
];
