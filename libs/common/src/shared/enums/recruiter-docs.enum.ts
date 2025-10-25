// Enums for recruiter verification document types and status

export enum RecruiterDocumentType {
  // Individual documents
  NATIONAL_ID = 'NATIONAL_ID', //NIN
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  VOTERS_CARD = 'VOTERS_CARD',
  UTILITY_BILL = 'UTILITY_BILL',
  TENANCY_AGREEMENT = 'TENANCY_AGREEMENT',

  // Organization (CAC) documents
  CAC_RC = 'CAC_RC',
  CAC_BN = 'CAC_BN',
  CAC_IT = 'CAC_IT',
  CAC_LP = 'CAC_LP',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
