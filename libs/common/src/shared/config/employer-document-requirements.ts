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
      documentType: EmployerDocumentType.GOVERNMENT_ISSUED_ID,
      mandatory: true,
      description: "Government-issued ID (NIN slip, international passport, or voter's card)",
      purpose: 'Confirms identity of the hiring individual',
    },

    {
      documentType: EmployerDocumentType.UTILITY_BILL,
      mandatory: true,
      description: 'Utility bill',
      purpose: 'Confirms legitimacy of location',
    },
  ],

  [EmployerType.SME]: [
    {
      documentType: EmployerDocumentType.CAC_REGISTRATION_CERTIFICATE,
      mandatory: true,
      description: 'Business registration certificate (CAC)',
      purpose: 'Confirms legal entity',
    },
    {
      documentType: EmployerDocumentType.OWNER_GOVERNMENT_ID,
      mandatory: true,
      description: "Owner's government-issued ID",
      purpose: 'Confirms identity of business owner',
    },
    {
      documentType:
        EmployerDocumentType.SIGNED_LEGITIMATE_BUSINESS_DECLARATION,
      mandatory: true,
      description:
        'Signed declaration confirming legitimate business hiring purpose',
      purpose: 'Confirms hiring intent and legitimacy',
    },
  ],

  [EmployerType.ORGANIZATION]: [
    {
      documentType: EmployerDocumentType.CAC_REGISTRATION_CERTIFICATE,
      mandatory: true,
      description: 'Certificate of Incorporation (CAC)',
      purpose: 'Legal entity proof',
    },
    {
      documentType: EmployerDocumentType.DIRECTOR_GOVERNMENT_ID,
      mandatory: true,
      description: "One director's government-issued ID",
      purpose: 'Confirms executive identity',
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
