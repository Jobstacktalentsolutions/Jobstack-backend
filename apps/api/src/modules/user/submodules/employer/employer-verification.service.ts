import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployerVerification } from '@app/common/database/entities/EmployerVerification.entity';
import { EmployerVerificationDocument } from '@app/common/database/entities/EmployerVerificationDocument.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { StorageService } from '@app/common/storage/storage.service';
import { UploadEmployerVerificationDocumentDto } from './dto/upload-employer-verification-document.dto';
import { UpdateVerificationInfoDto } from './dto/update-verification.dto';
import { MulterFile } from '@app/common/shared/types';
import {
  DocumentType,
  EmployerType,
} from '@app/common/database/entities/schema.enum';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import {
  getMandatoryDocuments,
  getAllDocuments,
  isDocumentMandatory,
} from '@app/common/shared/config/employer-document-requirements';

@Injectable()
export class EmployerVerificationService {
  constructor(
    @InjectRepository(EmployerVerification)
    private readonly verificationRepo: Repository<EmployerVerification>,
    @InjectRepository(EmployerVerificationDocument)
    private readonly verificationDocRepo: Repository<EmployerVerificationDocument>,
    @InjectRepository(EmployerProfile)
    private readonly profileRepo: Repository<EmployerProfile>,
    private readonly storageService: StorageService,
  ) {}

  // Get current user's verification with all documents
  async getMyVerification(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    const existing = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
      relations: ['documents', 'documents.document'],
    });
    return { ...existing, employer: profile };
  }

  // Update verification information
  async updateVerificationInfo(userId: string, dto: UpdateVerificationInfoDto) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    // Get or create verification record
    let verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
    });

    if (!verification) {
      verification = this.verificationRepo.create({
        employerId: profile.id,
      });
    }

    // Update verification fields
    verification.companyName = dto.companyName;
    verification.companyAddress = dto.companyAddress;
    verification.state = dto.state;
    verification.city = dto.city;
    verification.companySize = dto.companySize;
    verification.socialOrWebsiteUrl = dto.socialOrWebsiteUrl;

    // Set status to PENDING when user starts onboarding
    if (verification.status === VerificationStatus.NOT_STARTED) {
      verification.status = VerificationStatus.PENDING;
    }

    await this.verificationRepo.save(verification);

    return verification;
  }

  // Upload a single verification document
  async uploadVerificationDocument(
    userId: string,
    dto: UploadEmployerVerificationDocumentDto,
    file: MulterFile,
  ) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    // Get or create verification record
    let verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
    });

    if (!verification) {
      verification = this.verificationRepo.create({
        employerId: profile.id,
        status: VerificationStatus.PENDING,
      });
      await this.verificationRepo.save(verification);
    } else if (verification.status === VerificationStatus.NOT_STARTED) {
      verification.status = VerificationStatus.PENDING;
      await this.verificationRepo.save(verification);
    }

    // Upload document file
    const docUpload = await this.storageService.uploadFile(file as any, {
      folder: `employers/${profile.id}/verification`,
      bucketType: 'private',
      documentType: DocumentType.ID_DOCUMENT,
      uploadedBy: userId,
    });

    // Create verification document record
    const verificationDoc = this.verificationDocRepo.create({
      verificationId: verification.id,
      documentId: docUpload.document.id,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      verified: true,
    });

    await this.verificationDocRepo.save(verificationDoc);

    // Check if this document upload enables auto-verification
    const autoVerifyResult = await this.performAutoVerification(userId);

    return {
      ...verificationDoc,
      document: docUpload.document,
      autoVerificationResult: autoVerifyResult,
    };
  }

  // Get all verification documents for current user
  async getMyVerificationDocuments(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    const verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
    });

    if (!verification) return [];

    return await this.verificationDocRepo.find({
      where: { verificationId: verification.id },
      relations: ['document'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get single verification document with signed URL for current user
  async getMyVerificationDocumentWithSignedUrl(
    userId: string,
    documentId: string,
  ) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    const verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId, verificationId: verification.id },
      relations: ['document'],
    });

    if (!verificationDoc || !verificationDoc.document) {
      throw new NotFoundException('Document not found');
    }

    const signedUrl = await this.storageService.getSignedUrl(
      verificationDoc.document.fileKey,
      3600,
      false,
      verificationDoc.document.bucketType,
    );

    return {
      document: verificationDoc,
      signedUrl,
    };
  }

  // Delete a verification document (employer only)
  async deleteVerificationDocument(userId: string, documentId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    const verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId, verificationId: verification.id },
    });

    if (!verificationDoc) {
      throw new NotFoundException('Document not found');
    }

    // Delete the document from storage
    await this.storageService.deleteDocument(verificationDoc.documentId);

    // Delete the verification document record
    await this.verificationDocRepo.remove(verificationDoc);

    return { message: 'Document deleted successfully' };
  }

  // Admin: Get verification documents for an employer
  async getEmployerVerificationDocuments(employerId: string) {
    const verification = await this.verificationRepo.findOne({
      where: { employerId },
    });

    if (!verification) return [];

    return await this.verificationDocRepo.find({
      where: { verificationId: verification.id },
      relations: ['document'],
      order: { createdAt: 'DESC' },
    });
  }

  // Admin: Delete a verification document
  async adminDeleteVerificationDocument(documentId: string) {
    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId },
    });

    if (!verificationDoc) {
      throw new NotFoundException('Document not found');
    }

    // Delete the document from storage
    await this.storageService.deleteDocument(verificationDoc.documentId);

    // Delete the verification document record
    await this.verificationDocRepo.remove(verificationDoc);

    return { message: 'Document deleted successfully' };
  }

  // Get document requirements for an employer type
  async getDocumentRequirements(employerType: EmployerType) {
    return getAllDocuments(employerType);
  }

  // Check if employer can be automatically verified
  async checkAutoVerificationEligibility(userId: string): Promise<{
    canAutoVerify: boolean;
    missingMandatoryDocuments: string[];
    verificationStatus: VerificationStatus;
  }> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });

    if (!profile || !profile.type) {
      return {
        canAutoVerify: false,
        missingMandatoryDocuments: ['Employer type not set'],
        verificationStatus: VerificationStatus.PENDING,
      };
    }

    const verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
      relations: ['documents'],
    });

    if (!verification) {
      const mandatoryDocs = getMandatoryDocuments(profile.type);
      return {
        canAutoVerify: false,
        missingMandatoryDocuments: mandatoryDocs.map((doc) => doc.description),
        verificationStatus: VerificationStatus.PENDING,
      };
    }

    // Get all mandatory documents for this employer type
    const mandatoryDocuments = getMandatoryDocuments(profile.type);
    const uploadedDocumentTypes = verification.documents
      .filter((doc) => doc.verified)
      .map((doc) => doc.documentType);

    // Check for missing mandatory documents
    const missingMandatory = mandatoryDocuments.filter(
      (req) => !uploadedDocumentTypes.includes(req.documentType),
    );

    const canAutoVerify = missingMandatory.length === 0;

    return {
      canAutoVerify,
      missingMandatoryDocuments: missingMandatory.map((doc) => doc.description),
      verificationStatus: verification.status,
    };
  }

  // Perform automatic verification if eligible
  async performAutoVerification(userId: string): Promise<{
    verified: boolean;
    message: string;
  }> {
    const eligibility = await this.checkAutoVerificationEligibility(userId);

    if (!eligibility.canAutoVerify) {
      return {
        verified: false,
        message: `Cannot auto-verify. Missing: ${eligibility.missingMandatoryDocuments.join(', ')}`,
      };
    }

    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });

    if (!profile) {
      return {
        verified: false,
        message: 'Employer profile not found',
      };
    }

    const verification = await this.verificationRepo.findOne({
      where: { employerId: profile.id },
    });

    if (verification && verification.status === VerificationStatus.PENDING) {
      verification.status = VerificationStatus.APPROVED;
      verification.reviewedAt = new Date();
      await this.verificationRepo.save(verification);

      return {
        verified: true,
        message: 'Employer automatically verified successfully',
      };
    }

    return {
      verified: false,
      message: 'Verification already processed or not found',
    };
  }

  // Admin: Manually verify/reject an employer
  async adminUpdateVerificationStatus(
    employerId: string,
    status: VerificationStatus,
    adminId: string,
    rejectionReason?: string,
  ) {
    const verification = await this.verificationRepo.findOne({
      where: { employerId },
    });

    if (!verification) {
      throw new NotFoundException('Verification record not found');
    }

    verification.status = status;
    verification.reviewedByAdminId = adminId;
    verification.reviewedAt = new Date();

    if (status === VerificationStatus.REJECTED && rejectionReason) {
      verification.rejectionReason = rejectionReason;
    }

    await this.verificationRepo.save(verification);

    return verification;
  }

  // Admin: Mark a document as verified/unverified
  async adminUpdateDocumentVerification(
    documentId: string,
    verified: boolean,
    adminId: string,
  ) {
    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId },
      relations: ['verification', 'verification.employer'],
    });

    if (!verificationDoc) {
      throw new NotFoundException('Verification document not found');
    }

    verificationDoc.verified = verified;
    await this.verificationDocRepo.save(verificationDoc);

    // Check if this change affects auto-verification eligibility
    const employerId = verificationDoc.verification.employer.id;
    const autoVerifyResult = await this.performAutoVerification(employerId);

    return {
      document: verificationDoc,
      autoVerificationResult: autoVerifyResult,
    };
  }
}
