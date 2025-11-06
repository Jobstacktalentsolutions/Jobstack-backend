# SME Recruiter Type and Document Verification System

## Overview

This document outlines the implementation of the SME (Small and Medium Enterprises) recruiter type and the enhanced document verification system for JobStack.

## Recruiter Types

The system now supports three types of recruiters:

### 1. Individual Employers (households, private persons)

**Mandatory Documents:**

- Valid ID (National ID or International Passport) - Confirms identity
- Proof of address (utility bill or tenancy agreement) - Confirms legitimacy of location
- Guarantor details - Confirms legitimacy of location
- Signed service agreement (digital) - Accepts Jobstack's terms, fees, and consent for deductions
- Payment method setup (card or bank details) - For fee and salary payments

### 2. SME (Small Businesses / Organizations)

**Mandatory Documents:**

- Business registration certificate (CAC) - Confirms legal entity
- Payment details (corporate account) - For transactions
- Signed service agreement - Legally binds employer to T&Cs and fees

**Optional Documents:**

- Company ID or official letterhead - Confirms authority of representative
- Tax Identification Number (TIN) - Helps for invoicing and compliance

### 3. Large Organizations / Companies

**Mandatory Documents:**

- Certificate of Incorporation (CAC) - Legal entity proof
- Contact person ID and authorization letter - Ensures authorized account setup
- Payment information (corporate account) - For processing salary and fees
- Signed service agreement - Legally binds employer to T&Cs and fees

**Optional Documents:**

- Corporate profile or company website link - Context and credibility

## Automatic Verification System

### How It Works

1. **Document Upload**: When a recruiter uploads a document, the system checks if all mandatory documents for their type are uploaded and verified.

2. **Auto-Verification**: If all mandatory documents are uploaded and verified by an admin, the recruiter is automatically approved.

3. **Manual Override**: Admins can still manually approve or reject recruiters regardless of document status.

### API Endpoints

#### Recruiter Endpoints

- `GET /recruiters/verification` - Get verification status
- `PUT /recruiters/verification` - Update verification information
- `GET /recruiters/verification/documents` - Get uploaded documents
- `POST /recruiters/verification/documents` - Upload a document
- `DELETE /recruiters/verification/documents/:id` - Delete a document
- `GET /recruiters/verification/requirements` - Get document requirements for recruiter type
- `GET /recruiters/verification/auto-verify/check` - Check auto-verification eligibility
- `POST /recruiters/verification/auto-verify` - Trigger auto-verification

#### Admin Endpoints

- `GET /admin/recruiters/:recruiterId/verification/documents` - Get recruiter documents
- `DELETE /admin/recruiters/:recruiterId/verification/documents/:id` - Delete document
- `PUT /admin/recruiters/:recruiterId/verification/status` - Update verification status
- `PUT /admin/recruiters/:recruiterId/verification/documents/:id/verify` - Mark document as verified

## Database Changes

### Migration: AddSmeRecruiterType

The migration adds:

1. SME to the `RecruiterType` enum
2. New document types for all recruiter categories
3. Updates existing enum values to support the new document types

### New Document Types

- `NATIONAL_ID` - National ID
- `INTERNATIONAL_PASSPORT` - International Passport
- `PROOF_OF_ADDRESS` - Utility bill or tenancy agreement
- `GUARANTOR_DETAILS` - Guarantor information document
- `SERVICE_AGREEMENT` - Signed service agreement
- `PAYMENT_METHOD` - Payment method setup proof
- `BUSINESS_REGISTRATION` - CAC Business registration certificate
- `COMPANY_ID` - Company ID or official letterhead
- `TAX_IDENTIFICATION` - Tax Identification Number (TIN)
- `CORPORATE_PAYMENT_DETAILS` - Corporate account details
- `CERTIFICATE_OF_INCORPORATION` - CAC Certificate of Incorporation
- `CORPORATE_PROFILE` - Corporate profile or company website link
- `AUTHORIZATION_LETTER` - Contact person ID and authorization letter
- `CORPORATE_ACCOUNT_DETAILS` - Corporate account for transactions

## Configuration

Document requirements are configured in `libs/common/src/shared/config/recruiter-document-requirements.ts`. This allows for easy modification of requirements without code changes.

## Usage Examples

### Check Auto-Verification Eligibility

```typescript
const eligibility =
  await verificationService.checkAutoVerificationEligibility(userId);
console.log(eligibility.canAutoVerify); // true/false
console.log(eligibility.missingMandatoryDocuments); // array of missing documents
```

### Get Document Requirements

```typescript
const requirements = await verificationService.getDocumentRequirements(
  RecruiterType.SME,
);
const mandatory = requirements.filter((req) => req.mandatory);
const optional = requirements.filter((req) => !req.mandatory);
```

### Admin Document Verification

```typescript
// Mark document as verified
const result = await verificationService.adminUpdateDocumentVerification(
  documentId,
  true, // verified
  adminId,
);

// This may trigger auto-verification if all mandatory documents are now verified
console.log(result.autoVerificationResult);
```

## Benefits

1. **Streamlined Process**: Automatic verification reduces manual admin work
2. **Clear Requirements**: Each recruiter type has clearly defined document requirements
3. **Flexibility**: Optional documents allow for additional verification without blocking the process
4. **Audit Trail**: All verification actions are tracked with timestamps and admin IDs
5. **Type Safety**: Strong TypeScript typing ensures data consistency
