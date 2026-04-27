import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployerVerificationDocument } from '@app/common/database/entities/EmployerVerificationDocument.entity';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { StorageService } from '@app/common/storage/storage.service';
import { UploadEmployerVerificationDocumentDto } from './dto/upload-employer-verification-document.dto';
import { UpdateVerificationInfoDto } from './dto/update-verification.dto';
import { UpdateDocumentVerificationDto } from './dto/admin-verification.dto';
import { MulterFile } from '@app/common/shared/types';
import {
  DocumentType,
  EmployerType,
} from '@app/common/database/entities/schema.enum';
import {
  VerificationStatus,
  EmployerDocumentType,
} from '@app/common/shared/enums/employer-docs.enum';
import { VerificationDocumentStatus } from '@app/common/shared/enums/verification-document-status.enum';
import {
  getMandatoryDocuments,
  getAllDocuments,
} from '@app/common/shared/config/employer-document-requirements';
import { NotificationService } from 'apps/api/src/modules/notification/notification.service';
import { ApprovalDecisionEmailService } from '../../approval-decision-email.service';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { NotificationPriority } from '@app/common/database/entities/schema.enum';

@Injectable()
export class EmployerVerificationService {
  constructor(
    @InjectRepository(EmployerVerificationDocument)
    private readonly verificationDocRepo: Repository<EmployerVerificationDocument>,
    @InjectRepository(EmployerProfile)
    private readonly profileRepo: Repository<EmployerProfile>,
    private readonly storageService: StorageService,
    private readonly notificationService: NotificationService,
    private readonly approvalDecisionEmailService: ApprovalDecisionEmailService,
  ) {}

  // Get current user's verification with all documents
  async getMyVerification(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
      relations: ['verificationDocuments', 'verificationDocuments.document'],
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    return {
      ...profile,
      status: profile.verificationStatus,
      rejectionReason: profile.verificationRejectionReason,
      documents: profile.verificationDocuments,
      employer: profile,
    };
  }

  // Update verification information
  async updateVerificationInfo(userId: string, dto: UpdateVerificationInfoDto) {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Employer profile not found');

    profile.companyName = dto.companyName;
    profile.companyAddress = dto.companyAddress;
    profile.state = dto.state;
    profile.city = dto.city;
    profile.companySize = dto.companySize;
    profile.socialOrWebsiteUrl = dto.socialOrWebsiteUrl;
    profile.companyWebsite = dto.companyWebsite;
    profile.companyDescription = dto.companyDescription;

    if (profile.verificationStatus === VerificationStatus.NOT_STARTED) {
      profile.verificationStatus = VerificationStatus.PENDING;
    }

    await this.profileRepo.save(profile);

    return profile;
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

    if (profile.verificationStatus === VerificationStatus.NOT_STARTED) {
      profile.verificationStatus = VerificationStatus.PENDING;
      await this.profileRepo.save(profile);
    }

    const docUpload = await this.storageService.uploadFile(file as any, {
      folder: `employers/${profile.id}/verification`,
      bucketType: 'private',
      documentType: DocumentType.ID_DOCUMENT,
      uploadedBy: userId,
    });

    const verificationDoc = this.verificationDocRepo.create({
      employerProfileId: profile.id,
      documentId: docUpload.document.id,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      status: VerificationDocumentStatus.PENDING,
    });

    await this.verificationDocRepo.save(verificationDoc);

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

    return await this.verificationDocRepo.find({
      where: { employerProfileId: profile.id },
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

    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId, employerProfileId: profile.id },
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

    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId, employerProfileId: profile.id },
    });

    if (!verificationDoc) {
      throw new NotFoundException('Document not found');
    }

    await this.storageService.deleteDocument(verificationDoc.documentId);
    await this.verificationDocRepo.remove(verificationDoc);

    return { message: 'Document deleted successfully' };
  }

  // Admin: Get verification documents for an employer
  async getEmployerVerificationDocuments(employerId: string) {
    return await this.verificationDocRepo.find({
      where: { employerProfileId: employerId },
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

    await this.storageService.deleteDocument(verificationDoc.documentId);
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
      relations: ['verificationDocuments'],
    });

    if (!profile || !profile.type) {
      return {
        canAutoVerify: false,
        missingMandatoryDocuments: ['Employer type not set'],
        verificationStatus: VerificationStatus.PENDING,
      };
    }

    const mandatoryDocuments = getMandatoryDocuments(profile.type);
    const uploadedDocumentTypes = (profile.verificationDocuments ?? [])
      .filter((doc) => doc.status === VerificationDocumentStatus.APPROVED)
      .map((doc) => doc.documentType);

    const missingMandatory = mandatoryDocuments.filter(
      (req) => !uploadedDocumentTypes.includes(req.documentType),
    );

    const canAutoVerify = missingMandatory.length === 0;

    return {
      canAutoVerify,
      missingMandatoryDocuments: missingMandatory.map((doc) => doc.description),
      verificationStatus: profile.verificationStatus,
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
      relations: ['auth'],
    });

    if (!profile) {
      return {
        verified: false,
        message: 'Employer profile not found',
      };
    }

    if (profile.verificationStatus === VerificationStatus.PENDING) {
      const previousStatus = profile.verificationStatus;
      profile.verificationStatus = VerificationStatus.APPROVED;
      profile.reviewedAt = new Date();
      profile.reviewedByAdminId = undefined;
      profile.verificationRejectionReason = undefined;
      await this.profileRepo.save(profile);

      await this.approveAllEmployerDocuments(profile.id, null);

      try {
        await this.notificationService.createAppNotification(
          profile.id,
          UserRole.EMPLOYER,
          {
            title: 'Account Verified',
            message:
              'Your employer account has been verified. You can now post jobs and hire candidates.',
            priority: NotificationPriority.HIGH,
          },
        );
      } catch (_) {
        /* non-blocking */
      }

      if (profile.auth) {
        this.approvalDecisionEmailService.queueEmployerVerificationEmail(
          profile,
          previousStatus,
          VerificationStatus.APPROVED,
        );
      }

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
    const profile = await this.profileRepo.findOne({
      where: { id: employerId },
      relations: ['auth'],
    });

    if (!profile) {
      throw new NotFoundException('Verification record not found');
    }

    const previousStatus = profile.verificationStatus;
    profile.verificationStatus = status;
    profile.reviewedByAdminId = adminId;
    profile.reviewedAt = new Date();

    if (status === VerificationStatus.REJECTED && rejectionReason) {
      profile.verificationRejectionReason = rejectionReason;
    } else {
      profile.verificationRejectionReason = undefined;
    }

    await this.profileRepo.save(profile);

    if (status === VerificationStatus.APPROVED) {
      await this.approveAllEmployerDocuments(profile.id, adminId);
    }

    if (profile.auth) {
      this.approvalDecisionEmailService.queueEmployerVerificationEmail(
        profile,
        previousStatus,
        status,
        rejectionReason,
      );
    }

    try {
      if (status === VerificationStatus.APPROVED) {
        await this.notificationService.createAppNotification(
          employerId,
          UserRole.EMPLOYER,
          {
            title: 'Account Verified',
            message:
              'Your employer account has been approved. You can now post jobs and hire candidates.',
            priority: NotificationPriority.HIGH,
          },
        );
      } else if (status === VerificationStatus.REJECTED) {
        await this.notificationService.createAppNotification(
          employerId,
          UserRole.EMPLOYER,
          {
            title: 'Verification Rejected',
            message: `Your employer verification was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
            priority: NotificationPriority.HIGH,
          },
        );
      }
    } catch (_) {
      /* non-blocking */
    }

    return profile;
  }

  // Marks all employer verification files approved (used on overall approval / auto-verify).
  private async approveAllEmployerDocuments(
    employerProfileId: string,
    adminId: string | null,
  ): Promise<void> {
    const docs = await this.verificationDocRepo.find({
      where: { employerProfileId },
    });
    const now = new Date();
    for (const d of docs) {
      d.status = VerificationDocumentStatus.APPROVED;
      d.rejectionReason = undefined;
      d.reviewedAt = now;
      d.reviewedByAdminId = adminId ?? undefined;
    }
    if (docs.length > 0) {
      await this.verificationDocRepo.save(docs);
    }
  }

  // Human-readable label for employer document rejection emails.
  private formatEmployerDocumentTypeLabel(
    documentType: EmployerDocumentType,
  ): string {
    return String(documentType)
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }

  // Admin: set per-document verification status (pending / approved / rejected).
  async adminUpdateDocumentVerification(
    documentId: string,
    dto: UpdateDocumentVerificationDto,
    adminId: string,
  ) {
    const verificationDoc = await this.verificationDocRepo.findOne({
      where: { id: documentId },
      relations: ['employerProfile', 'employerProfile.auth'],
    });

    if (!verificationDoc) {
      throw new NotFoundException('Verification document not found');
    }

    const employer = verificationDoc.employerProfile;
    const previousStatus = verificationDoc.status;

    verificationDoc.status = dto.status;
    verificationDoc.rejectionReason =
      dto.status === VerificationDocumentStatus.REJECTED
        ? (dto.rejectionReason ?? '').trim() || undefined
        : undefined;
    verificationDoc.reviewedAt = new Date();
    verificationDoc.reviewedByAdminId = adminId;
    await this.verificationDocRepo.save(verificationDoc);

    if (
      dto.status === VerificationDocumentStatus.REJECTED &&
      verificationDoc.rejectionReason &&
      previousStatus !== VerificationDocumentStatus.REJECTED
    ) {
      this.approvalDecisionEmailService.queueEmployerVerificationDocumentRejectedEmail(
        employer,
        this.formatEmployerDocumentTypeLabel(verificationDoc.documentType),
        verificationDoc.rejectionReason,
      );
    }

    const employerId = employer.id;
    const autoVerifyResult = await this.performAutoVerification(employerId);

    return {
      document: verificationDoc,
      autoVerificationResult: autoVerifyResult,
    };
  }
}
