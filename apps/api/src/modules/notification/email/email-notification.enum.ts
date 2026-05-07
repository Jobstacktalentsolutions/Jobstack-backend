export enum EmailTemplateType {
  JOBSEEKER_WELCOME = 'jobseeker-welcome',
  EMPLOYER_WELCOME = 'employer-welcome',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
  JOB_APPLICATION_RECEIVED = 'job-application-received',
  JOB_APPLICATION_STATUS = 'job-application-status',
  NEW_JOB_POSTED = 'new-job-posted',
  /** Personalized “new published job” for jobseekers matched on publish */
  JOB_MATCH_RECOMMENDATION = 'job-match-recommendation',
  URGENT_JOB_MATCH_ALERT = 'urgent-job-match-alert',
  INTERVIEW_SCHEDULED = 'interview-scheduled',
  GENERAL_NOTIFICATION = 'general-notification',
  JOBSEEKER_WELCOME = 'jobseeker-welcome',
  EMPLOYER_WELCOME = 'employer-welcome',
  VETTING_COMPLETE = 'vetting-complete',
  CANDIDATE_SELECTED_FOR_SCREENING = 'candidate-selected-for-screening',
  CANDIDATE_SCREENING_COMPLETED = 'candidate-screening-completed',
  EMPLOYER_SCREENING_INVITATION = 'employer-screening-invitation',
  PROBATION_REMINDER_EMPLOYER = 'probation-reminder-employer',
  PROBATION_DAY30_PULSE_EMPLOYER = 'probation-day30-pulse-employer',
  PROBATION_DAY60_PULSE_EMPLOYER = 'probation-day60-pulse-employer',
  PROBATION_CONFIRMED = 'probation-confirmed',
  ADMIN_REPLACEMENT_TO_EMPLOYER = 'admin-replacement-to-employer',
  ADMIN_REPLACEMENT_TO_CANDIDATE = 'admin-replacement-to-candidate',
  /** Employer: job reached ACTIVE (admin activation or go-live after publish). */
  JOB_ACTIVATED_EMPLOYER = 'job-activated-employer',
  CONTRACT_READY_FOR_SIGNATURE = 'contract-ready-for-signature',
  EMPLOYEE_ACTIVATION_PAYMENT_REQUIRED = 'employee-activation-payment-required',
  EMPLOYEE_ACTIVATION_PAYMENT_CONFIRMED = 'employee-activation-payment-confirmed',
  CONTACT_FORM_SUBMISSION = 'contact-form-submission',
  JOBSEEKER_ONBOARDING_REVIEW = 'jobseeker-onboarding-review',
  EMPLOYER_ONBOARDING_REVIEW = 'employer-onboarding-review',
}

export const EMAIL_TYPE_CONFIG = {
  [EmailTemplateType.JOBSEEKER_WELCOME]: {
    subject: 'Welcome to JobStack',
    template: 'jobseeker-welcome.ejs',
  },
  [EmailTemplateType.EMPLOYER_WELCOME]: {
    subject: 'Welcome to JobStack',
    template: 'employer-welcome.ejs',
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
  [EmailTemplateType.URGENT_JOB_MATCH_ALERT]: {
    subject: 'Urgent: no matching candidates found for published job',
    template: 'urgent-job-match-alert.ejs',
  },
  [EmailTemplateType.INTERVIEW_SCHEDULED]: {
    subject: 'Interview Scheduled',
    template: 'interview-scheduled.ejs',
  },
  [EmailTemplateType.GENERAL_NOTIFICATION]: {
    subject: 'Notification from JobStack',
    template: 'general-notification.ejs',
  },
  [EmailTemplateType.JOBSEEKER_WELCOME]: {
    subject: 'Welcome to JobStack',
    template: 'welcome.ejs',
  },
  [EmailTemplateType.EMPLOYER_WELCOME]: {
    subject: 'Welcome to JobStack',
    template: 'welcome.ejs',
  },
  [EmailTemplateType.VETTING_COMPLETE]: {
    subject: 'Vetting completed',
    template: 'vetting-complete.ejs',
  },
  [EmailTemplateType.CANDIDATE_SELECTED_FOR_SCREENING]: {
    subject: 'You have been selected for screening',
    template: 'candidate-selected-for-screening.ejs',
  },
  [EmailTemplateType.CANDIDATE_SCREENING_COMPLETED]: {
    subject: 'Screening completed - Next steps',
    template: 'candidate-screening-completed.ejs',
  },
  [EmailTemplateType.EMPLOYER_SCREENING_INVITATION]: {
    subject: 'Screening Invitation',
    template: 'employer-screening-invitation.ejs',
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
  [EmailTemplateType.CONTRACT_READY_FOR_SIGNATURE]: {
    subject: 'Agreement Ready for Signature',
    template: 'contract-ready-for-signature.ejs',
  },
  [EmailTemplateType.EMPLOYEE_ACTIVATION_PAYMENT_REQUIRED]: {
    subject: 'Payment Required',
    template: 'employee-activation-payment-required.ejs',
  },
  [EmailTemplateType.EMPLOYEE_ACTIVATION_PAYMENT_CONFIRMED]: {
    subject: 'Payment Confirmed',
    template: 'employee-activation-payment-confirmed.ejs',
  },
  [EmailTemplateType.CONTACT_FORM_SUBMISSION]: {
    subject: 'New Contact Form Submission',
    template: 'contact-form-notification.ejs',
  },
  [EmailTemplateType.JOBSEEKER_ONBOARDING_REVIEW]: {
    subject: 'Your profile is in review',
    template: 'jobseeker-onboarding-review.ejs',
  },
  [EmailTemplateType.EMPLOYER_ONBOARDING_REVIEW]: {
    subject: 'Your employer profile is in review',
    template: 'employer-onboarding-review.ejs',
  },
} as const;
