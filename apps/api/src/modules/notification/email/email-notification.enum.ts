export enum EmailTemplateType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  JOB_APPLICATION_RECEIVED = 'job-application-received',
  JOB_APPLICATION_STATUS = 'job-application-status',
  NEW_JOB_POSTED = 'new-job-posted',
  INTERVIEW_SCHEDULED = 'interview-scheduled',
  GENERAL_NOTIFICATION = 'general-notification',
}

export const EMAIL_TYPE_CONFIG = {
  [EmailTemplateType.WELCOME]: {
    subject: 'Welcome to JobStack',
    template: 'welcome.ejs',
  },
  [EmailTemplateType.PASSWORD_RESET]: {
    subject: 'Reset Your Password',
    template: 'password-reset.ejs',
  },
  [EmailTemplateType.EMAIL_VERIFICATION]: {
    subject: 'Verify Your Email Address',
    template: 'email-verification.ejs',
  },
  [EmailTemplateType.JOB_APPLICATION_RECEIVED]: {
    subject: 'Job Application Received',
    template: 'job-application-received.ejs',
  },
  [EmailTemplateType.JOB_APPLICATION_STATUS]: {
    subject: 'Job Application Status Update',
    template: 'job-application-status.ejs',
  },
  [EmailTemplateType.NEW_JOB_POSTED]: {
    subject: 'New Job Opportunity',
    template: 'new-job-posted.ejs',
  },
  [EmailTemplateType.INTERVIEW_SCHEDULED]: {
    subject: 'Interview Scheduled',
    template: 'interview-scheduled.ejs',
  },
  [EmailTemplateType.GENERAL_NOTIFICATION]: {
    subject: 'Notification from JobStack',
    template: 'general-notification.ejs',
  },
} as const;
