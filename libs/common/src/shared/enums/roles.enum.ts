export enum PrivilegeLevel {
  BASIC = 1,
  ELEVATED = 2,
  FULL = 3,
}

export const AdminRole = {
  SUPER_ADMIN: {
    privilegeLevel: PrivilegeLevel.FULL,
    role: 'SUPER_ADMIN',
  },
  VETTING_SPECIALIST: {
    privilegeLevel: PrivilegeLevel.ELEVATED,
    role: 'VETTING_SPECIALIST',
  },
  OPERATIONS_SUPPORT: {
    privilegeLevel: PrivilegeLevel.ELEVATED,
    role: 'OPERATIONS_SUPPORT',
  },
  FINANCE_BILLING_MANAGER: {
    privilegeLevel: PrivilegeLevel.ELEVATED,
    role: 'FINANCE_BILLING_MANAGER',
  },
};
