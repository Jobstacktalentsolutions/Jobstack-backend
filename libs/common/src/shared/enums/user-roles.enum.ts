export enum UserRole {
  JOB_SEEKER = 'job_seeker',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export type UserRoleType = keyof typeof UserRole;
