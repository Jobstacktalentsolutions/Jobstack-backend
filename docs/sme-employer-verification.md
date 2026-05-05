# SME Employer Type and Document Verification System

## Overview

This document outlines the implementation of the SME (Small and Medium Enterprises) employer type and the enhanced document verification system for JobStack.

## Employer Types

The system now supports three types of employers:

### 1. Individual Employers (households, private persons)

**Mandatory Documents:**

- Government-issued ID (NIN slip, international passport, or voter's card) - Confirms identity
- Utility bill - Confirms legitimacy of location

### 2. SME (Small Businesses / Organizations)

**Mandatory Documents:**

- Business registration certificate (CAC) - Confirms legal entity
- Owner's government-issued ID - Confirms business owner identity
- Signed declaration confirming legitimate business hiring purpose - Confirms hiring legitimacy

### 3. Large Organizations / Companies

**Mandatory Documents:**

- CAC registration certificate - Legal entity proof
- One director's government-issued ID - Confirms executive identity

## Automatic Verification System

### How It Works

1. **Document Upload**: When an employer uploads a document, the system checks if all mandatory documents for their type are uploaded and verified.

2. **Auto-Verification**: If all mandatory documents are uploaded and verified by an admin, the employer is automatically approved.

3. **Manual Override**: Admins can still manually approve or reject employers regardless of document status.

### API Endpoints

#### Employer Endpoints

- `GET /employers/verification` - Get verification status
- `PUT /employers/verification` - Update verification information
- `GET /employers/verification/documents` - Get uploaded documents
- `POST /employers/verification/documents` - Upload a document
- `DELETE /employers/verification/documents/:id` - Delete a document
- `GET /employers/verification/requirements` - Get document requirements for employer type
- `GET /employers/verification/auto-verify/check` - Check auto-verification eligibility
- `POST /employers/verification/auto-verify` - Trigger auto-verification

#### Admin Endpoints

- `GET /admin/employers/:employerId/verification/documents` - Get employer documents
- `DELETE /admin/employers/:employerId/verification/documents/:id` - Delete document
- `PUT /admin/employers/:employerId/verification/status` - Update verification status
- `PUT /admin/employers/:employerId/verification/documents/:id/verify` - Mark document as verified

## Database Changes

### Migration: Employer Verification Flattening

The migration and refactor adds:

1. Verification attributes moved from `employer_verification` into `employer_profiles`
2. Employer verification documents linked directly to `EmployerProfile`
3. Requirement matrix narrowed to approved document types only

### New Document Types

- `GOVERNMENT_ISSUED_ID` - Government-issued ID for individual employers
- `UTILITY_BILL` - Utility bill for address confirmation
- `CAC_REGISTRATION_CERTIFICATE` - CAC registration certificate
- `OWNER_GOVERNMENT_ID` - Owner government-issued ID for SME employers
- `DIRECTOR_GOVERNMENT_ID` - Director government-issued ID for registered companies
- `SIGNED_LEGITIMATE_BUSINESS_DECLARATION` - Signed legitimate hiring declaration

## Configuration

Document requirements are configured in `libs/common/src/shared/config/employer-document-requirements.ts`. This allows for easy modification of requirements without code changes.

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
  EmployerType.SME,
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
2. **Clear Requirements**: Each employer type has clearly defined document requirements
3. **Flexibility**: Optional documents allow for additional verification without blocking the process
4. **Audit Trail**: All verification actions are tracked with timestamps and admin IDs
5. **Type Safety**: Strong TypeScript typing ensures data consistency
