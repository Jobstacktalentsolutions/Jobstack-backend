import { RecruiterDocumentType } from '../enums/recruiter-docs.enum';
import { RecruiterType } from '../../database/entities/schema.enum';

export interface DocumentRequirement {
  documentType: RecruiterDocumentType;
  mandatory: boolean;
  description: string;
  purpose: string;
}

export const RECRUITER_DOCUMENT_REQUIREMENTS: Record<
  RecruiterType,
  DocumentRequirement[]
> = {
  [RecruiterType.INDIVIDUAL]: [
    {
      documentType: RecruiterDocumentType.NATIONAL_ID,
      mandatory: true,
      description: 'Valid National ID',
      purpose: 'Confirms identity',
    },

    {
      documentType: RecruiterDocumentType.PROOF_OF_ADDRESS,
      mandatory: true,
      description: 'Utility bill or tenancy agreement',
      purpose: 'Confirms legitimacy of location',
    },

    // todo : temporarily disabled
    // {
    //   documentType: RecruiterDocumentType.GUARANTOR_DETAILS,
    //   mandatory: true,
    //   description: 'Guarantor details document',
    //   purpose: 'Confirms legitimacy of location',
    // },
    // {
    //   documentType: RecruiterDocumentType.SERVICE_AGREEMENT,
    //   mandatory: true,
    //   description: 'Signed service agreement (digital)',
    //   purpose: "Accepts Jobstack's terms, fees, and consent for deductions",
    // },
    // {
    //   documentType: RecruiterDocumentType.PAYMENT_METHOD,
    //   mandatory: true,
    //   description: 'Payment method setup (card or bank details)',
    //   purpose: 'For fee and salary payments',
    // },
  ],

  [RecruiterType.SME]: [
    {
      documentType: RecruiterDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
      mandatory: true,
      description: 'Business registration certificate (CAC)',
      purpose: 'Confirms legal entity',
    },
    {
      documentType: RecruiterDocumentType.COMPANY_ID,
      mandatory: false,
      description: 'Company ID or official letterhead',
      purpose: 'Confirms authority of representative',
    },
    {
      documentType: RecruiterDocumentType.TAX_IDENTIFICATION,
      mandatory: false,
      description: 'Tax Identification Number (TIN)',
      purpose: 'Helps for invoicing and compliance',
    },
    {
      documentType: RecruiterDocumentType.CORPORATE_PAYMENT_DETAILS,
      mandatory: true,
      description: 'Payment details (corporate account)',
      purpose: 'For transactions',
    },
    {
      documentType: RecruiterDocumentType.SERVICE_AGREEMENT,
      mandatory: true,
      description: 'Signed service agreement',
      purpose: 'Legally binds employer to T&Cs and fees',
    },
  ],

  [RecruiterType.ORGANIZATION]: [
    {
      documentType: RecruiterDocumentType.CERTIFICATE_OF_INCORPORATION,
      mandatory: true,
      description: 'Certificate of Incorporation (CAC)',
      purpose: 'Legal entity proof',
    },
    {
      documentType: RecruiterDocumentType.CORPORATE_PROFILE,
      mandatory: false,
      description: 'Corporate profile or company website link',
      purpose: 'Context and credibility',
    },
    {
      documentType: RecruiterDocumentType.AUTHORIZATION_LETTER,
      mandatory: true,
      description: 'Contact person ID and authorization letter',
      purpose: 'Ensures the staff setting up the account is authorized',
    },
    {
      documentType: RecruiterDocumentType.CORPORATE_ACCOUNT_DETAILS,
      mandatory: true,
      description: 'Payment information (corporate account)',
      purpose: 'For processing salary and fees',
    },
    {
      documentType: RecruiterDocumentType.SERVICE_AGREEMENT,
      mandatory: true,
      description: 'Signed service agreement',
      purpose: 'Legally binds employer to T&Cs and fees',
    },
  ],
};

/**
 * Get mandatory documents for a recruiter type
 */
export function getMandatoryDocuments(
  recruiterType: RecruiterType,
): DocumentRequirement[] {
  return RECRUITER_DOCUMENT_REQUIREMENTS[recruiterType].filter(
    (req) => req.mandatory,
  );
}

/**
 * Get optional documents for a recruiter type
 */
export function getOptionalDocuments(
  recruiterType: RecruiterType,
): DocumentRequirement[] {
  return RECRUITER_DOCUMENT_REQUIREMENTS[recruiterType].filter(
    (req) => !req.mandatory,
  );
}

/**
 * Get all documents for a recruiter type
 */
export function getAllDocuments(
  recruiterType: RecruiterType,
): DocumentRequirement[] {
  return RECRUITER_DOCUMENT_REQUIREMENTS[recruiterType];
}

/**
 * Check if a document type is mandatory for a recruiter type
 */
export function isDocumentMandatory(
  recruiterType: RecruiterType,
  documentType: RecruiterDocumentType,
): boolean {
  const requirement = RECRUITER_DOCUMENT_REQUIREMENTS[recruiterType].find(
    (req) => req.documentType === documentType,
  );
  return requirement?.mandatory || false;
}
