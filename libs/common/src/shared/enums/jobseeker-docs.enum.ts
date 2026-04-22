// Enums for jobseeker identity document types

export enum JobseekerDocumentType {
  NIN = 'NIN',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  VOTERS_CARD = 'VOTERS_CARD',
}

/** Slot/category for rows in jobseeker_verification_documents (extensible). */
export enum JobseekerVerificationDocumentKind {
  ID_DOCUMENT = 'ID_DOCUMENT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
}
