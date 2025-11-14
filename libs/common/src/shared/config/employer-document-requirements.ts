import { EmployerDocumentType } from '../enums/employer-docs.enum';
import { EmployerType } from '../../database/entities/schema.enum';

export interface DocumentRequirement {
  documentType: EmployerDocumentType;
  mandatory: boolean;
  description: string;
  purpose: string;
}

export const EMPLOYER_DOCUMENT_REQUIREMENTS: Record<
  EmployerType,
  DocumentRequirement[]
> = {
  [EmployerType.INDIVIDUAL]: [
    {
      documentType: EmployerDocumentType.NATIONAL_ID,
      mandatory: true,
      description: 'Valid National ID',
      purpose: 'Confirms identity',
    },

    {
      documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
      mandatory: true,
      description: 'Utility bill or tenancy agreement',
      purpose: 'Confirms legitimacy of location',
    },
  ],

  [EmployerType.SME]: [
    {
      documentType: EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
      mandatory: true,
      description: 'Business registration certificate (CAC)',
      purpose: 'Confirms legal entity',
    },
    {
      documentType: EmployerDocumentType.COMPANY_ID,
      mandatory: false,
      description: 'Company ID or official letterhead',
      purpose: 'Confirms authority of representative',
    },
    {
      documentType: EmployerDocumentType.TAX_IDENTIFICATION,
      mandatory: false,
      description: 'Tax Identification Number (TIN)',
      purpose: 'Helps for invoicing and compliance',
    },
    {
      documentType: EmployerDocumentType.CORPORATE_PAYMENT_DETAILS,
      mandatory: true,
      description: 'Payment details (corporate account)',
      purpose: 'For transactions',
    },
    {
      documentType: EmployerDocumentType.SERVICE_AGREEMENT,
      mandatory: true,
      description: 'Signed service agreement',
      purpose: 'Legally binds employer to T&Cs and fees',
    },
  ],

  [EmployerType.ORGANIZATION]: [
    {
      documentType: EmployerDocumentType.CERTIFICATE_OF_INCORPORATION,
      mandatory: true,
      description: 'Certificate of Incorporation (CAC)',
      purpose: 'Legal entity proof',
    },
    {
      documentType: EmployerDocumentType.CORPORATE_PROFILE,
      mandatory: false,
      description: 'Corporate profile or company website link',
      purpose: 'Context and credibility',
    },
    {
      documentType: EmployerDocumentType.AUTHORIZATION_LETTER,
      mandatory: true,
      description: 'Contact person ID and authorization letter',
      purpose: 'Ensures the staff setting up the account is authorized',
    },
    {
      documentType: EmployerDocumentType.CORPORATE_ACCOUNT_DETAILS,
      mandatory: true,
      description: 'Payment information (corporate account)',
      purpose: 'For processing salary and fees',
    },
    {
      documentType: EmployerDocumentType.SERVICE_AGREEMENT,
      mandatory: true,
      description: 'Signed service agreement',
      purpose: 'Legally binds employer to T&Cs and fees',
    },
  ],
};

/**
 * Get mandatory documents for an employer type
 */
export function getMandatoryDocuments(
  employerType: EmployerType,
): DocumentRequirement[] {
  return EMPLOYER_DOCUMENT_REQUIREMENTS[employerType].filter(
    (req) => req.mandatory,
  );
}

/**
 * Get optional documents for an employer type
 */
export function getOptionalDocuments(
  employerType: EmployerType,
): DocumentRequirement[] {
  return EMPLOYER_DOCUMENT_REQUIREMENTS[employerType].filter(
    (req) => !req.mandatory,
  );
}

/**
 * Get all documents for an employer type
 */
export function getAllDocuments(
  employerType: EmployerType,
): DocumentRequirement[] {
  return EMPLOYER_DOCUMENT_REQUIREMENTS[employerType];
}

/**
 * Check if a document type is mandatory for an employer type
 */
export function isDocumentMandatory(
  employerType: EmployerType,
  documentType: EmployerDocumentType,
): boolean {
  const requirement = EMPLOYER_DOCUMENT_REQUIREMENTS[employerType].find(
    (req) => req.documentType === documentType,
  );
  return requirement?.mandatory || false;
}
