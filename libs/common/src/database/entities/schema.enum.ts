// Skill related enums
export enum SkillStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUGGESTED = 'SUGGESTED',
}

export enum SkillCategory {
  SOFTWARE_DEVELOPMENT = 'SOFTWARE_DEVELOPMENT',
  DESIGN = 'DESIGN',
  ACCOUNTING_FINANCE = 'ACCOUNTING_FINANCE',
  SALES_MARKETING = 'SALES_MARKETING',
  OPERATIONS = 'OPERATIONS',
  BUSINESS_ADMIN = 'BUSINESS_ADMIN',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  HEALTHCARE_PHARMA = 'HEALTHCARE_PHARMA',
  EDUCATION_TRAINING = 'EDUCATION_TRAINING',
  MEDIA_CREATIVE = 'MEDIA_CREATIVE',
  HR_ADMIN = 'HR_ADMIN',
  LEGAL_COMPLIANCE = 'LEGAL_COMPLIANCE',
  CONSTRUCTION_REAL_ESTATE = 'CONSTRUCTION_REAL_ESTATE',
  MAINTENANCE_TRADES = 'MAINTENANCE_TRADES',
  HOSPITALITY = 'HOSPITALITY',
  SECURITY = 'SECURITY',
  TRANSPORT_LOGISTICS = 'TRANSPORT_LOGISTICS',
  AGRICULTURE = 'AGRICULTURE',
}

export enum SkillType {
  HIGH_SKILL = 'HIGH_SKILL',
  LOW_SKILL = 'LOW_SKILL',
}

// Mapping of skill types to skill categories
// Used to determine which categories are high skill vs low skill
export const SkillTypeCategory: Record<SkillType, SkillCategory[]> = {
  [SkillType.HIGH_SKILL]: [
    SkillCategory.SOFTWARE_DEVELOPMENT,
    SkillCategory.DESIGN,
    SkillCategory.ACCOUNTING_FINANCE,
    SkillCategory.SALES_MARKETING,
    SkillCategory.OPERATIONS,
    SkillCategory.BUSINESS_ADMIN,
    SkillCategory.CUSTOMER_SERVICE,
    SkillCategory.HEALTHCARE_PHARMA,
    SkillCategory.EDUCATION_TRAINING,
    SkillCategory.MEDIA_CREATIVE,
    SkillCategory.HR_ADMIN,
    SkillCategory.LEGAL_COMPLIANCE,
    SkillCategory.CONSTRUCTION_REAL_ESTATE,
    SkillCategory.AGRICULTURE,
  ],
  [SkillType.LOW_SKILL]: [
    SkillCategory.MAINTENANCE_TRADES,
    SkillCategory.HOSPITALITY,
    SkillCategory.SECURITY,
    SkillCategory.TRANSPORT_LOGISTICS,
  ],
};

// Utility function to get skill type from category
export function getSkillTypeFromCategory(category: SkillCategory): SkillType {
  if (SkillTypeCategory[SkillType.HIGH_SKILL].includes(category)) {
    return SkillType.HIGH_SKILL;
  }
  return SkillType.LOW_SKILL;
}

// Employer related enums
export enum EmployerType {
  INDIVIDUAL = 'Individual',
  SME = 'SME', // Small and Medium Enterprises
  ORGANIZATION = 'Organization',
}

export enum EmployerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// Notification related enums
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export enum NotificationType {
  EMAIL = 'email',
  APP = 'app',
}

export enum NotificationPriority {
  LOW = 4,
  MEDIUM = 3,
  HIGH = 2,
  URGENT = 1,
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
}

export enum EmploymentArrangement {
  PERMANENT_EMPLOYEE = 'PERMANENT_EMPLOYEE',
  CONTRACT = 'CONTRACT',
}

export enum ContractPaymentType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  FIXED_PROJECT = 'FIXED_PROJECT',
  MONTHLY_CONTRACT = 'MONTHLY_CONTRACT',
}

export enum WorkMode {
  REMOTE = 'REMOTE',
  HYBRID = 'HYBRID',
  ON_SITE = 'ON_SITE',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE', // when the admin permits it to be active
  CLOSED = 'CLOSED',
}

/** True when job seekers can browse and apply (legacy published or admin-activated live). */
export function isJobOpenOnMarketplace(status: JobStatus): boolean {
  return status === JobStatus.PUBLISHED || status === JobStatus.ACTIVE;
}

// It always appears in this order
export enum JobApplicationStatus {
  APPLIED = 'APPLIED',
  WITHDRAWN = 'WITHDRAWN',
  VETTED = 'VETTED',
  SELECTED_FOR_SCREENING = 'SELECTED_FOR_SCREENING',
  SELECTED_FOR_HIRE = 'SELECTED_FOR_HIRE',
  OFFER_SENT = 'OFFER_SENT',
  APPLICANT_ACCEPTED = 'APPLICANT_ACCEPTED',
  PAYMENT_COMPLETE = 'PAYMENT_COMPLETE',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export enum ProbationStatus {
  ACTIVE = 'ACTIVE',
  CONFIRMED = 'CONFIRMED',
  TERMINATED = 'TERMINATED',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ONBOARDING = 'ONBOARDING',
  SUSPENDED = 'SUSPENDED',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
  /** Mutual completion confirmed by both employer and jobseeker. */
  ENDED = 'ENDED',
}

/** True when employment is no longer active for staffing/placement purposes. */
export function isEmployeeTerminalStatus(status: EmployeeStatus): boolean {
  return (
    status === EmployeeStatus.ENDED ||
    status === EmployeeStatus.TERMINATED ||
    status === EmployeeStatus.COMPLETED
  );
}

/** Eligible to declare mutual completion (not already ended). */
export function isEmployeeOpenForMutualCompletion(
  status: EmployeeStatus,
): boolean {
  return (
    status === EmployeeStatus.ACTIVE || status === EmployeeStatus.ONBOARDING
  );
}

/** HR categorization when employment is ended by employer. */
export enum EmployeeTerminationHrMeaning {
  EMPLOYEE_RESIGNED = 'EMPLOYEE_RESIGNED',
  EMPLOYEE_TERMINATED = 'EMPLOYEE_TERMINATED',
  ROLE_REDUNDANT = 'ROLE_REDUNDANT',
  MUTUAL_SEPARATION = 'MUTUAL_SEPARATION',
  OTHER = 'OTHER',
}

/** Who submitted a row in employment_feedback. */
export enum EmploymentFeedbackReviewerRole {
  EMPLOYER = 'EMPLOYER',
  JOBSEEKER = 'JOBSEEKER',
}

// Jobseeker related enums
export enum Proficiency {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum ApprovalStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DocumentType {
  CV = 'CV',
  PORTFOLIO = 'PORTFOLIO',
  CERTIFICATE = 'CERTIFICATE',
  ID_DOCUMENT = 'ID_DOCUMENT',
  PROFILE_PICTURE = 'PROFILE_PICTURE',
  SIGNATURE = 'SIGNATURE',
  OTHER = 'OTHER',
}

// Payment related enums
export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentType {
  EMPLOYEE_ACTIVATION_FEE = 'EMPLOYEE_ACTIVATION_FEE', // Agency commission with floor/ceiling/VAT (for both permanent and contract employees)
}

export enum EmployeePaymentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum ContractStatus {
  PENDING_SIGNATURES = 'PENDING_SIGNATURES',
  EMPLOYER_SIGNED = 'EMPLOYER_SIGNED',
  EMPLOYEE_SIGNED = 'EMPLOYEE_SIGNED',
  FULLY_EXECUTED = 'FULLY_EXECUTED',
  CANCELLED = 'CANCELLED',
}

export enum ContractTemplateType {
  PERMANENT_EMPLOYMENT = 'PERMANENT_EMPLOYMENT',
  FIXED_TERM_CONTRACT = 'FIXED_TERM_CONTRACT',
  FREELANCE_CONTRACT = 'FREELANCE_CONTRACT',
  PROBATIONARY_CONTRACT = 'PROBATIONARY_CONTRACT',
  INTERNSHIP_AGREEMENT = 'INTERNSHIP_AGREEMENT',
  NON_DISCLOSURE_AGREEMENT = 'NON_DISCLOSURE_AGREEMENT',
  NON_COMPETE_AGREEMENT = 'NON_COMPETE_AGREEMENT',
  INTELLECTUAL_PROPERTY_ASSIGNMENT = 'INTELLECTUAL_PROPERTY_ASSIGNMENT',
}
