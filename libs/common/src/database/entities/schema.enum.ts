// Skill related enums
export enum SkillStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUGGESTED = 'SUGGESTED',
}

export enum SkillCategory {
  TECHNICAL = 'TECHNICAL',
  DATABASE = 'DATABASE',
  BUSINESS = 'BUSINESS',
  DESIGN = 'DESIGN',
  FINANCE_ACCOUNTING = 'FINANCE_ACCOUNTING',
  SALES_MARKETING = 'SALES_MARKETING',
  OPERATIONS = 'OPERATIONS',
  COMMUNICATION = 'COMMUNICATION',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  SOFTWARE_DEVELOPMENT = 'SOFTWARE_DEVELOPMENT',
  HOME_SUPPORT = 'HOME_SUPPORT',
  MAINTENANCE_TRADES = 'MAINTENANCE_TRADES',
  HOSPITALITY = 'HOSPITALITY',
  SECURITY = 'SECURITY',
  TRANSPORT_LOGISTICS = 'TRANSPORT_LOGISTICS',
  OTHERS = 'OTHERS',
}

export enum SkillType {
  HIGH_SKILL = 'HIGH_SKILL',
  LOW_SKILL = 'LOW_SKILL',
}

// Mapping of skill types to skill categories
// Used to determine which categories are high skill vs low skill
export const SkillTypeCategory: Record<SkillType, SkillCategory[]> = {
  [SkillType.HIGH_SKILL]: [
    SkillCategory.TECHNICAL,
    SkillCategory.DATABASE,
    SkillCategory.SOFTWARE_DEVELOPMENT,
    SkillCategory.DESIGN,
    SkillCategory.FINANCE_ACCOUNTING,
    SkillCategory.BUSINESS,
    SkillCategory.SALES_MARKETING,
    SkillCategory.OPERATIONS,
  ],
  [SkillType.LOW_SKILL]: [
    SkillCategory.HOME_SUPPORT,
    SkillCategory.MAINTENANCE_TRADES,
    SkillCategory.HOSPITALITY,
    SkillCategory.SECURITY,
    SkillCategory.TRANSPORT_LOGISTICS,
    SkillCategory.COMMUNICATION,
    SkillCategory.SOCIAL_MEDIA,
    SkillCategory.OTHERS,
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

export enum JobApplicationStatus {
  APPLIED = 'APPLIED',
  VETTED = 'VETTED',
  SELECTED_FOR_SCREENING = 'SELECTED_FOR_SCREENING',
  SCREENING_COMPLETED = 'SCREENING_COMPLETED',
  EMPLOYER_ACCEPTED = 'EMPLOYER_ACCEPTED',
  APPLICANT_ACCEPTED = 'APPLICANT_ACCEPTED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  OFFERED = 'OFFERED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ONBOARDING = 'ONBOARDING',
  SUSPENDED = 'SUSPENDED',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED',
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
