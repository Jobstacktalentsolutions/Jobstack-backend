import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterVerification } from '@app/common/database/entities/RecruiterVerification.entity';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { StorageService } from '@app/common/storage/storage.service';
import { RecruiterVerificationDto } from './dto/recruiter-verification.dto';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';
import { RecruiterType } from 'apps/api/src/modules/auth/submodules/recruiter/dto/recruiter-auth.dto';
import { MulterFile } from '@app/common/shared/types';
@Injectable()
export class RecruiterVerificationService {
  constructor(
    @InjectRepository(RecruiterVerification)
    private readonly verificationRepo: Repository<RecruiterVerification>,
    @InjectRepository(RecruiterProfile)
    private readonly profileRepo: Repository<RecruiterProfile>,
    private readonly storageService: StorageService,
  ) {}

  // Get current user's verification
  async getMyVerification(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { authId: userId },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    const existing = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
    });
    return existing || null;
  }

  // Submit or resubmit verification
  async submitVerification(
    userId: string,
    dto: RecruiterVerificationDto,
    files: { documentFile?: MulterFile; proofOfAddressFile?: MulterFile },
  ) {
    const profile = await this.profileRepo.findOne({
      where: { authId: userId },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');

    // Validate file presence
    if (!files.documentFile) {
      throw new BadRequestException('documentFile is required');
    }
    if (
      dto.submissionType === RecruiterType.INDIVIDUAL &&
      !files.proofOfAddressFile
    ) {
      throw new BadRequestException(
        'proofOfAddressFile is required for INDIVIDUAL',
      );
    }

    // Upload files
    const docUpload = await this.storageService.uploadFile(
      files.documentFile as any,
      {
        folder: `recruiters/${profile.id}/verification`,
        bucketType: 'private',
      },
    );

    let proofUrl: string | undefined;
    if (files.proofOfAddressFile) {
      const proofUpload = await this.storageService.uploadFile(
        files.proofOfAddressFile as any,
        {
          folder: `recruiters/${profile.id}/verification`,
          bucketType: 'private',
        },
      );
      proofUrl = proofUpload.url;
    }

    // Upsert verification row
    let verification = await this.verificationRepo.findOne({
      where: { recruiterId: profile.id },
    });

    if (!verification) {
      verification = this.verificationRepo.create({
        recruiterId: profile.id,
      });
    }

    verification.submissionType = dto.submissionType;
    verification.documentType = dto.documentType;
    verification.documentNumber = dto.documentNumber;
    verification.documentFileUrl = docUpload.url;
    verification.proofOfAddressUrl = proofUrl;
    verification.businessAddress = dto.businessAddress;
    verification.tin = dto.tin;
    verification.status = VerificationStatus.PENDING;
    verification.reviewedAt = undefined;
    verification.reviewedByAdminId = undefined;
    verification.rejectionReason = undefined;

    await this.verificationRepo.save(verification);

    return verification;
  }
}
