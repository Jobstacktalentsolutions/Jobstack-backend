// Skill related enums
export enum SkillStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUGGESTED = 'SUGGESTED',
}

export enum SkillCategory {
  HIGH_SKILL = 'HIGH_SKILL',
  LOW_SKILL = 'LOW_SKILL',
}

// Mapping of subcategories to skill levels with job counts
export interface SkillSubcategoryMapping {
  [subcategory: string]: number; // subcategory name -> job count
}

export const SkillCategoryMapping: Record<SkillCategory, SkillSubcategoryMapping> = {
  [SkillCategory.HIGH_SKILL]: {
    TECHNICAL: 0,
    DATABASE: 0,
    SOFTWARE_DEVELOPMENT: 0,
    DESIGN: 0,
    FINANCE_ACCOUNTING: 0,
    BUSINESS: 0,
    SALES_MARKETING: 0,
    OPERATIONS: 0,
    COMMUNICATION: 0,
    SOCIAL_MEDIA: 0,
  },
  [SkillCategory.LOW_SKILL]: {
    HOME_SUPPORT: 0,
    MAINTENANCE_TRADES: 0,
    HOSPITALITY: 0,
    SECURITY: 0,
    TRANSPORT_LOGISTICS: 0,
    OTHERS: 0,
  },
};

// Helper function to get skill level from subcategory
export function getSkillLevelFromSubcategory(
  subcategory: string,
): SkillCategory | null {
  if (
    SkillCategoryMapping[SkillCategory.HIGH_SKILL].hasOwnProperty(subcategory)
  ) {
    return SkillCategory.HIGH_SKILL;
  }
  if (
    SkillCategoryMapping[SkillCategory.LOW_SKILL].hasOwnProperty(subcategory)
  ) {
    return SkillCategory.LOW_SKILL;
  }
  return null;
}

// Helper function to get all subcategories for a skill level
export function getSubcategoriesForSkillLevel(
  skillLevel: SkillCategory,
): string[] {
  return Object.keys(SkillCategoryMapping[skillLevel]);
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
  VETTED = 'VETTED', // Application has been automatically vetted and ranked
  SELECTED_FOR_SCREENING = 'SELECTED_FOR_SCREENING', // Selected by admin for screening (phone/video interview)
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
