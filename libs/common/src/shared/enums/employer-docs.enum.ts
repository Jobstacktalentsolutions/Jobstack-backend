// Enums for employer verification document types and status

export enum EmployerDocumentType {
  // Individual documents
  NATIONAL_ID = 'NATIONAL_ID', // National ID
  INTERNATIONAL_PASSPORT = 'INTERNATIONAL_PASSPORT', // International Passport
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS', // Utility bill or tenancy agreement
  GUARANTOR_DETAILS = 'GUARANTOR_DETAILS', // Guarantor information document
  SERVICE_AGREEMENT = 'SERVICE_AGREEMENT', // Signed service agreement
  PAYMENT_METHOD = 'PAYMENT_METHOD', // Payment method setup proof

  // SME/Small Business documents
  CERTIFICATE_OF_BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION', // CAC Business registration certificate
  COMPANY_ID = 'COMPANY_ID', // Company ID or official letterhead
  TAX_IDENTIFICATION = 'TAX_IDENTIFICATION', // Tax Identification Number (TIN)
  CORPORATE_PAYMENT_DETAILS = 'CORPORATE_PAYMENT_DETAILS', // Corporate account details

  // Large Organization documents
  CERTIFICATE_OF_INCORPORATION = 'CERTIFICATE_OF_INCORPORATION', // CAC Certificate of Incorporation
  CORPORATE_PROFILE = 'CORPORATE_PROFILE', // Corporate profile or company website link
  AUTHORIZATION_LETTER = 'AUTHORIZATION_LETTER', // Contact person ID and authorization letter
  CORPORATE_ACCOUNT_DETAILS = 'CORPORATE_ACCOUNT_DETAILS', // Corporate account for transactions
}

export enum VerificationStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
