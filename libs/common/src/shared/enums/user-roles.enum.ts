export enum UserRole {
  JOB_SEEKER = 'job_seeker',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

export type UserRoleType = keyof typeof UserRole;
