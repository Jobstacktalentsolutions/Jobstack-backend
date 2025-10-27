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
  USER_MANAGEMENT: {
    privilegeLevel: PrivilegeLevel.ELEVATED,
    role: 'USER_MANAGEMENT',
  },
  CONTENT_MODERATION: {
    privilegeLevel: PrivilegeLevel.ELEVATED,
    role: 'CONTENT_MODERATION',
  },
  ANALYTICS: {
    privilegeLevel: PrivilegeLevel.BASIC,
    role: 'ANALYTICS',
  },
};
