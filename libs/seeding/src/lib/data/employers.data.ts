import { CONSTANT_IDS } from './constant.data';
import {
  VerificationStatus,
  EmployerDocumentType,
} from '@app/common/shared/enums/employer-docs.enum';
import { hashSync } from 'bcryptjs';
import { EmployerType } from '@app/common/database/entities/schema.enum';

const passwordHash = hashSync('password123', 10);

export const EMPLOYERS_DATA = [
  {
    id: CONSTANT_IDS.EMPLOYERS[0],
    firstName: 'Amaka',
    lastName: 'Okoye',
    email: 'amaka.okoye@lagosbuilds.com',
    phoneNumber: '+2348011001100',
    address: '12 Admiralty Way, Lekki, Lagos',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'Lagos Builds Ltd',
      companyAddress: '12 Admiralty Way, Lekki, Lagos',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[0],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[1],
          documentType: EmployerDocumentType.TAX_IDENTIFICATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[1],
    firstName: 'Kunle',
    lastName: 'Adebayo',
    email: 'kunle.adebayo@digitalpulse.ng',
    phoneNumber: '+2348012001200',
    address: '3 Saka Tinubu, Victoria Island, Lagos',
    type: EmployerType.SME,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'Digital Pulse Nigeria',
      companyAddress: '3 Saka Tinubu, Victoria Island, Lagos',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[2],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[3],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[2],
    firstName: 'Halima',
    lastName: 'Bello',
    email: 'halima.bello@northstar.com',
    phoneNumber: '+2348013001300',
    address: '22 Gana Street, Maitama, Abuja',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'NorthStar Ventures',
      companyAddress: '22 Gana Street, Maitama, Abuja',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[4],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[5],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[3],
    firstName: 'Ifeoma',
    lastName: 'Eze',
    email: 'ifeoma.eze@fintrust.com',
    phoneNumber: '+2348014001400',
    address: '7 Ozumba Mbadiwe, Victoria Island, Lagos',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'FinTrust Capital',
      companyAddress: '7 Ozumba Mbadiwe, Victoria Island, Lagos',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[6],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[7],
          documentType: EmployerDocumentType.TAX_IDENTIFICATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[4],
    firstName: 'Chidi',
    lastName: 'Nwosu',
    email: 'chidi.nwosu@greenagro.ng',
    phoneNumber: '+2348015001500',
    address: '45 Aba Road, Port Harcourt',
    type: EmployerType.SME,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'GreenAgro Foods',
      companyAddress: '45 Aba Road, Port Harcourt',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[8],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[9],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[5],
    firstName: 'Aisha',
    lastName: 'Yusuf',
    email: 'aisha.yusuf@healthlink.ng',
    phoneNumber: '+2348016001600',
    address: '18 Herbert Macaulay Way, Yaba, Lagos',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'HealthLink Clinics',
      companyAddress: '18 Herbert Macaulay Way, Yaba, Lagos',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[10],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[11],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[6],
    firstName: 'Emeka',
    lastName: 'Opara',
    email: 'emeka.opara@techbridge.africa',
    phoneNumber: '+2348017001700',
    address: '15 Admiralty Road, Lekki Phase 1, Lagos',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'TechBridge Africa',
      companyAddress: '15 Admiralty Road, Lekki Phase 1, Lagos',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[12],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[13],
          documentType: EmployerDocumentType.TAX_IDENTIFICATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[7],
    firstName: 'Tosin',
    lastName: 'Adeola',
    email: 'tosin.adeola@marketverse.com',
    phoneNumber: '+2348018001800',
    address: '9 Broad Street, Lagos Island',
    type: EmployerType.SME,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'MarketVerse Commerce',
      companyAddress: '9 Broad Street, Lagos Island',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[14],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[15],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[8],
    firstName: 'Sade',
    lastName: 'Balogun',
    email: 'sade.balogun@creativehub.ng',
    phoneNumber: '+2348019001900',
    address: '14 Tafawa Balewa Way, Abuja',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'Creative Hub Studios',
      companyAddress: '14 Tafawa Balewa Way, Abuja',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[16],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[17],
          documentType: EmployerDocumentType.TAX_IDENTIFICATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[9],
    firstName: 'Musa',
    lastName: 'Danladi',
    email: 'musa.danladi@logxpress.ng',
    phoneNumber: '+2348020002000',
    address: '88 Kaduna Road, Kano',
    type: EmployerType.SME,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'LogXpress Logistics',
      companyAddress: '88 Kaduna Road, Kano',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[18],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[19],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[10],
    firstName: 'Bisi',
    lastName: 'Olawale',
    email: 'bisi.olawale@homesupport.africa',
    phoneNumber: '+2348021002100',
    address: '6 Opebi Road, Ikeja, Lagos',
    type: EmployerType.INDIVIDUAL,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'Home Support Services',
      companyAddress: '6 Opebi Road, Ikeja, Lagos',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[20],
          documentType: EmployerDocumentType.NATIONAL_ID,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[21],
          documentType: EmployerDocumentType.PROOF_OF_ADDRESS,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
  {
    id: CONSTANT_IDS.EMPLOYERS[11],
    firstName: 'Zainab',
    lastName: 'Mahmoud',
    email: 'zainab.mahmoud@sahelsecurity.com',
    phoneNumber: '+2348022002200',
    address: '3 Ahmadu Bello Way, Kaduna',
    type: EmployerType.ORGANIZATION,
    passwordHash,
    emailVerified: true,
    verification: {
      companyName: 'Sahel Security Group',
      companyAddress: '3 Ahmadu Bello Way, Kaduna',
      status: VerificationStatus.APPROVED,
      documents: [
        {
          documentId: CONSTANT_IDS.DOCUMENTS[22],
          documentType:
            EmployerDocumentType.CERTIFICATE_OF_BUSINESS_REGISTRATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
        {
          documentId: CONSTANT_IDS.DOCUMENTS[23],
          documentType: EmployerDocumentType.TAX_IDENTIFICATION,
          status: VerificationStatus.APPROVED,
          verified: true,
        },
      ],
    },
  },
];
