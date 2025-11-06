import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterVerification } from '@app/common/database/entities/RecruiterVerification.entity';
import { RecruiterVerificationDocument } from '@app/common/database/entities/RecruiterVerificationDocument.entity';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { StorageService } from '@app/common/storage/storage.service';
import { UploadVerificationDocumentDto } from './dto/upload-verification-document.dto';
import { UpdateVerificationInfoDto } from './dto/update-verification.dto';
import { MulterFile } from '@app/common/shared/types';
import {
  DocumentType,
  RecruiterType,
} from '@app/common/database/entities/schema.enum';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';
import {
  getMandatoryDocuments,
  getAllDocuments,
  isDocumentMandatory,
} from '@app/common/shared/config/recruiter-document-requirements';
@Injectable()
export class RecruiterVerificationService {
  constructor(
    @InjectRepository(RecruiterVerification)
    private readonly verificationRepo: Repository<RecruiterVerification>,
    @InjectRepository(RecruiterVerificationDocument)
    private readonly verificationDocRepo: Repository<RecruiterVerificationDocument>,
    @InjectRepository(RecruiterProfile)
    private readonly profileRepo: Repository<RecruiterProfile>,
    private readonly storageService: StorageService,
  ) {}

  // Get current user's verification with all documents
  async getMyVerification(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    const existing = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
      relations: ['documents', 'documents.document'],
    });
    return existing || null;
  }

  // Update verification information
  async updateVerificationInfo(userId: string, dto: UpdateVerificationInfoDto) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    // Get or create verification record
    let verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
    });

    if (!verification) {
      verification = this.verificationRepo.create({
        recruiterId: profile.id,
      });
    }

    // Update verification fields (recruiterType is now in profile.type)
    verification.companyName = dto.companyName;
    verification.companyAddress = dto.companyAddress;
    verification.companySize = dto.companySize;
    verification.socialOrWebsiteUrl = dto.socialOrWebsiteUrl;
    verification.businessAddress = dto.businessAddress;

    await this.verificationRepo.save(verification);

    return verification;
  }

  // Upload a single verification document
  async uploadVerificationDocument(
    userId: string,
    dto: UploadVerificationDocumentDto,
    file: MulterFile,
  ) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    // Get or create verification record
    let verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
    });

    if (!verification) {
      verification = this.verificationRepo.create({
        recruiterId: profile.id,
      });
      await this.verificationRepo.save(verification);
    }

    // Upload document file
    const docUpload = await this.storageService.uploadFile(file as any, {
      folder: `recruiters/${profile.id}/verification`,
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
      verified: false,
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
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    const verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
    });

    if (!verification) return [];

    return await this.verificationDocRepo.find({
      where: { verificationId: verification.id },
      relations: ['document'],
      order: { createdAt: 'DESC' },
    });
  }

  // Delete a verification document (recruiter only)
  async deleteVerificationDocument(userId: string, documentId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    const verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
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

  // Admin: Get verification documents for a recruiter
  async getRecruiterVerificationDocuments(recruiterId: string) {
    const verification = await this.verificationRepo.findOne({
      where: { recruiterId },
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

  // Get document requirements for a recruiter type
  async getDocumentRequirements(recruiterType: RecruiterType) {
    return getAllDocuments(recruiterType);
  }

  // Check if recruiter can be automatically verified
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
        missingMandatoryDocuments: ['Recruiter type not set'],
        verificationStatus: VerificationStatus.PENDING,
      };
    }

    const verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
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

    // Get all mandatory documents for this recruiter type
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

    const verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
    });

    if (verification && verification.status === VerificationStatus.PENDING) {
      verification.status = VerificationStatus.APPROVED;
      verification.reviewedAt = new Date();
      await this.verificationRepo.save(verification);

      return {
        verified: true,
        message: 'Recruiter automatically verified successfully',
      };
    }

    return {
      verified: false,
      message: 'Verification already processed or not found',
    };
  }

  // Admin: Manually verify/reject a recruiter
  async adminUpdateVerificationStatus(
    recruiterId: string,
    status: VerificationStatus,
    adminId: string,
    rejectionReason?: string,
  ) {
    const verification = await this.verificationRepo.findOne({
      where: { recruiterId },
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
      relations: ['verification', 'verification.recruiter'],
    });

    if (!verificationDoc) {
      throw new NotFoundException('Verification document not found');
    }

    verificationDoc.verified = verified;
    await this.verificationDocRepo.save(verificationDoc);

    // Check if this change affects auto-verification eligibility
    const recruiterId = verificationDoc.verification.recruiter.id;
    const autoVerifyResult = await this.performAutoVerification(recruiterId);

    return {
      document: verificationDoc,
      autoVerificationResult: autoVerifyResult,
    };
  }
}
