export enum Permissions {
  // Admin Management
  ADMIN_CREATE = 'admin.create',
  ADMIN_READ = 'admin.read',
  ADMIN_UPDATE = 'admin.update',
  ADMIN_DELETE = 'admin.delete',

  // Recruiter Management
  RECRUITER_CREATE = 'recruiter.create',
  RECRUITER_READ = 'recruiter.read',
  RECRUITER_UPDATE = 'recruiter.update',
  RECRUITER_DELETE = 'recruiter.delete',

  // Jobseeker Management
  JOBSEEKER_CREATE = 'jobseeker.create',
  JOBSEEKER_READ = 'jobseeker.read',
  JOBSEEKER_UPDATE = 'jobseeker.update',
  JOBSEEKER_DELETE = 'jobseeker.delete',

  // Vetting
  VETTING_VIEW = 'vetting.view',
  VETTING_UPDATE = 'vetting.update',

  // Jobs / Matching
  JOB_CREATE = 'job.create',
  JOB_READ = 'job.read',
  JOB_UPDATE = 'job.update',
  JOB_DELETE = 'job.delete',
  MATCH_RUN = 'match.run',

  // Payments
  PAYMENT_VIEW = 'payment.view',
  PAYMENT_REFUND = 'payment.refund',

  // Notifications
  NOTIFICATION_SEND = 'notification.send',
}

export type PermissionKey = `${Permissions}`;
