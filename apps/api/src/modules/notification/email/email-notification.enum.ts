export enum EmailTemplateType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  JOB_APPLICATION_RECEIVED = 'job-application-received',
  JOB_APPLICATION_STATUS = 'job-application-status',
  NEW_JOB_POSTED = 'new-job-posted',
  /** Personalized “new published job” for jobseekers matched on publish */
  JOB_MATCH_RECOMMENDATION = 'job-match-recommendation',
  INTERVIEW_SCHEDULED = 'interview-scheduled',
  GENERAL_NOTIFICATION = 'general-notification',
  VETTING_COMPLETE = 'vetting-complete',
  CANDIDATE_SELECTED_FOR_SCREENING = 'candidate-selected-for-screening',
  PROBATION_REMINDER_EMPLOYER = 'probation-reminder-employer',
  PROBATION_DAY30_PULSE_EMPLOYER = 'probation-day30-pulse-employer',
  PROBATION_DAY60_PULSE_EMPLOYER = 'probation-day60-pulse-employer',
  PROBATION_CONFIRMED = 'probation-confirmed',
  ADMIN_REPLACEMENT_TO_EMPLOYER = 'admin-replacement-to-employer',
  ADMIN_REPLACEMENT_TO_CANDIDATE = 'admin-replacement-to-candidate',
  /** Employer: job reached ACTIVE (admin activation or go-live after publish). */
  JOB_ACTIVATED_EMPLOYER = 'job-activated-employer',
  CONTACT_FORM_SUBMISSION = 'contact-form-submission',
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
  [EmailTemplateType.JOB_MATCH_RECOMMENDATION]: {
    subject: 'A new job matches your profile',
    template: 'job-match-recommendation.ejs',
  },
  [EmailTemplateType.INTERVIEW_SCHEDULED]: {
    subject: 'Interview Scheduled',
    template: 'interview-scheduled.ejs',
  },
  [EmailTemplateType.GENERAL_NOTIFICATION]: {
    subject: 'Notification from JobStack',
    template: 'general-notification.ejs',
  },
  [EmailTemplateType.VETTING_COMPLETE]: {
    subject: 'Vetting completed',
    template: 'vetting-complete.ejs',
  },
  [EmailTemplateType.CANDIDATE_SELECTED_FOR_SCREENING]: {
    subject: 'You have been selected for screening',
    template: 'candidate-selected-for-screening.ejs',
  },
  [EmailTemplateType.PROBATION_REMINDER_EMPLOYER]: {
    subject: 'Probation Check-in Reminder',
    template: 'probation-reminder-employer.ejs',
  },
  [EmailTemplateType.PROBATION_DAY30_PULSE_EMPLOYER]: {
    subject: 'Probation Check-in Reminder',
    template: 'probation-reminder-employer.ejs',
  },
  [EmailTemplateType.PROBATION_DAY60_PULSE_EMPLOYER]: {
    subject: 'How is the placement going? (Day 60 Check-in)',
    template: 'probation-day60-pulse-employer.ejs',
  },
  [EmailTemplateType.PROBATION_CONFIRMED]: {
    subject: 'Placement Confirmed',
    template: 'probation-confirmed.ejs',
  },
  [EmailTemplateType.ADMIN_REPLACEMENT_TO_EMPLOYER]: {
    subject: 'Candidate Replacement Confirmed',
    template: 'admin-replacement-to-employer.ejs',
  },
  [EmailTemplateType.ADMIN_REPLACEMENT_TO_CANDIDATE]: {
    subject: 'You have been assigned to a job',
    template: 'admin-replacement-to-candidate.ejs',
  },
  [EmailTemplateType.JOB_ACTIVATED_EMPLOYER]: {
    subject: 'Your job is now active on JobStack',
    template: 'job-activated-employer.ejs',
  },
  [EmailTemplateType.CONTACT_FORM_SUBMISSION]: {
    subject: 'New Contact Form Submission',
    template: 'contact-form-notification.ejs',
  },
} as const;
