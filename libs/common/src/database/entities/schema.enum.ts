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

// Employer related enums
export enum EmployerType {
  INDIVIDUAL = 'Individual',
  SME = 'SME', // Small and Medium Enterprises
  ORGANIZATION = 'Organization',
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
  CLOSED = 'CLOSED',
}

export enum JobApplicationStatus {
  APPLIED = 'APPLIED',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEWING = 'INTERVIEWING',
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
  EMPLOYEE_ACTIVATION = 'EMPLOYEE_ACTIVATION',
  CONTRACT_ACTIVATION = 'CONTRACT_ACTIVATION',
}

export enum EmployeePaymentStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}
