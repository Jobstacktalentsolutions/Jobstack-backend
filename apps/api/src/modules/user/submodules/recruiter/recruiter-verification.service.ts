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
import { DocumentType } from '@app/common/database/entities/schema.enum';
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

    return {
      ...verificationDoc,
      document: docUpload.document,
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
}
