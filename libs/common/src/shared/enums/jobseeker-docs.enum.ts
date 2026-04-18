// Enums for jobseeker identity document types

export enum JobseekerDocumentType {
  NIN = 'NIN',
  PASSPORT = 'PASSPORT',
  VOTERS_CARD = 'VOTERS_CARD',
}

/** Slot/category for rows in jobseeker_verification_documents (extensible). */
export enum JobseekerVerificationDocumentKind {
  ID_DOCUMENT = 'ID_DOCUMENT',
}

