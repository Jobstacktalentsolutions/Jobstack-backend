export enum UserRole {
  JOB_SEEKER = 'JOBSEEKER',
  EMPLOYER = 'EMPLOYER',
  ADMIN = 'ADMIN',
}

export type UserRoleType = keyof typeof UserRole;
