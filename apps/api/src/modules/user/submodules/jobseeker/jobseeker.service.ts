import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { JobseekerSkill } from '@app/common/database/entities/JobseekerSkill.entity';
import { Document } from '@app/common/database/entities';
import { StorageService } from '@app/common/storage/storage.service';
import { SkillsService } from 'apps/api/src/modules/skills/skills.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetAllJobSeekersQueryDto } from './dto/get-all-jobseekers-query.dto';
import type { MulterFile } from '@app/common/shared/types';
import {
  DocumentType,
  ApprovalStatus,
} from '@app/common/database/entities/schema.enum';

@Injectable()
export class JobseekerService {
  constructor(
    @InjectRepository(JobSeekerProfile)
    protected readonly profileRepo: Repository<JobSeekerProfile>,
    @InjectRepository(JobseekerAuth)
    protected readonly authRepo: Repository<JobseekerAuth>,
    @InjectRepository(JobseekerSkill)
    protected readonly jobseekerSkillRepo: Repository<JobseekerSkill>,
    @InjectRepository(Document)
    protected readonly documentRepo: Repository<Document>,
    protected readonly storageService: StorageService,
    protected readonly skillsService: SkillsService,
  ) {}

  // Upload and set CV document (PDF-only)
  async uploadCv(
    userId: string,
    file: MulterFile,
  ): Promise<{ cvUrl: string; documentId: string }> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Jobseeker not found');

    // Enforce PDF mimetype
    const mime = (file.mimetype || '').toLowerCase();
    if (mime !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Delete existing CV if it exists
    if (profile.cvDocumentId) {
      await this.deleteCv(userId);
    }

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `jobseekers/${profile.id}/cv`,
      bucketType: 'private',
      documentType: DocumentType.CV,
      uploadedBy: userId,
      description: 'Job seeker CV',
    });

    profile.cvDocumentId = upload.document.id;

    // Set approvalStatus to PENDING when CV is uploaded (user has started onboarding)
    if (profile.approvalStatus === ApprovalStatus.NOT_STARTED) {
      profile.approvalStatus = ApprovalStatus.PENDING;
    }

    await this.profileRepo.save(profile);

    return {
      cvUrl: upload.url,
      documentId: upload.document.id,
    };
  }

  // Delete CV document (cvDocumentId will be automatically set to null by database)
  async deleteCv(userId: string): Promise<void> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Jobseeker not found');

    const currentDocumentId = profile.cvDocumentId;
    if (!currentDocumentId) return;

    await this.profileRepo.update(
      {
        id: profile.id,
      },
      {
        cvDocumentId: undefined,
      },
    );
    await this.storageService.deleteDocument(currentDocumentId);
  }

  // Get CV document with signed URL
  async getCvDocument(
    userId: string,
  ): Promise<{ document: Document; signedUrl: string } | null> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
      relations: ['cvDocument'],
    });
    if (!profile || !profile.cvDocument) {
      return null;
    }

    const document = profile.cvDocument;
    const signedUrl = await this.storageService.getSignedUrl(
      document.fileKey,
      3600, // 1 hour expiry
      true, // for download
      document.bucketType,
    );

    return { document, signedUrl };
  }

  // Upload and set profile picture document (image-only)
  async uploadProfilePicture(
    userId: string,
    file: MulterFile,
  ): Promise<{ pictureUrl: string; documentId: string }> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Jobseeker not found');

    // Enforce image mimetypes
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const mime = (file.mimetype || '').toLowerCase();
    if (!allowedMimeTypes.includes(mime)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Delete existing profile picture if it exists
    if (profile.profilePictureId) {
      await this.deleteProfilePicture(userId);
    }

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `jobseekers/${profile.id}/profile-picture`,
      bucketType: 'public',
      documentType: DocumentType.PROFILE_PICTURE,
      uploadedBy: userId,
      description: 'Job seeker profile picture',
    });

    profile.profilePictureId = upload.document.id;
    await this.profileRepo.save(profile);

    return {
      pictureUrl: upload.url,

      documentId: upload.document.id,
    };
  }

  // Delete profile picture document
  async deleteProfilePicture(userId: string): Promise<void> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Jobseeker not found');

    const currentDocumentId = profile.profilePictureId;
    if (!currentDocumentId) return;

    await this.profileRepo.update(
      {
        id: profile.id,
      },
      {
        profilePictureId: undefined,
      },
    );
    await this.storageService.deleteDocument(currentDocumentId);
  }

  // Get profile picture document with signed URL
  async getProfilePicture(
    userId: string,
  ): Promise<{ document: Document; signedUrl: string } | null> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
      relations: ['profilePicture'],
    });
    if (!profile || !profile.profilePicture) {
      return null;
    }

    const document = profile.profilePicture;
    const signedUrl = await this.storageService.getSignedUrl(
      document.fileKey,
      3600, // 1 hour expiry
      false, // not for download, just viewing
      document.bucketType,
    );

    return { document, signedUrl };
  }

  // Update jobseeker profile with smart skills handling
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<JobSeekerProfile> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) throw new NotFoundException('Jobseeker not found');

    // Update basic profile fields
    if (updateData.firstName !== undefined) {
      profile.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
      profile.lastName = updateData.lastName;
    }
    if (updateData.jobTitle !== undefined) {
      profile.jobTitle = updateData.jobTitle;
    }
    if (updateData.brief !== undefined) {
      profile.brief = updateData.brief;
    }
    if (updateData.phoneNumber !== undefined) {
      profile.phoneNumber = updateData.phoneNumber;
    }
    if (updateData.preferredLocation !== undefined) {
      profile.preferredLocation = updateData.preferredLocation;
    }
    if (updateData.address !== undefined) {
      profile.address = updateData.address;
    }
    if (updateData.state !== undefined) {
      profile.state = updateData.state;
    }
    if (updateData.city !== undefined) {
      profile.city = updateData.city;
    }
    if (updateData.minExpectedSalary !== undefined) {
      profile.minExpectedSalary = updateData.minExpectedSalary;
    }
    if (updateData.maxExpectedSalary !== undefined) {
      profile.maxExpectedSalary = updateData.maxExpectedSalary;
    }
    if (updateData.yearsOfExperience !== undefined) {
      profile.yearsOfExperience = updateData.yearsOfExperience;
    }

    // Handle skills smartly
    if (updateData.skills || updateData.skillIds) {
      // First, remove existing skills
      await this.jobseekerSkillRepo.delete({
        profileId: profile.id,
      });

      // Normalize and attach skills via SkillsService (non-transactional, best-effort)
      const normalizedIds = new Set<string>(updateData.skillIds ?? []);

      // For free-text names, always insert a SUGGESTED skill
      for (const name of updateData.skills ?? []) {
        const skill = await this.skillsService.insertSuggestedSkill(name);
        normalizedIds.add(skill.id);
      }

      await this.skillsService.attachSkillsToProfile(
        profile.id,
        Array.from(normalizedIds).map((skillId) => ({
          skillId,
        })),
      );
    }

    // Set approvalStatus to PENDING when user completes profile
    if (profile.approvalStatus === ApprovalStatus.NOT_STARTED) {
      profile.approvalStatus = ApprovalStatus.PENDING;
    }

    // Save the updated profile
    const updatedProfile = await this.profileRepo.save(profile);

    // Return profile with relations
    const profileWithRelations = await this.profileRepo.findOne({
      where: { id: updatedProfile.id },
      relations: ['userSkills', 'userSkills.skill', 'profilePicture'],
    });

    if (!profileWithRelations) {
      throw new NotFoundException('Profile not found after update');
    }

    return profileWithRelations;
  }

  // Get jobseeker profile by user ID
  async getProfile(userId: string): Promise<JobSeekerProfile> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
      relations: ['userSkills', 'userSkills.skill', 'profilePicture'],
    });
    if (!profile) throw new NotFoundException('Jobseeker not found');

    return profile;
  }

  // Admin methods for managing job seekers (paginated, search, sort, filter)
  async getAllJobSeekers(
    adminId: string,
    query: GetAllJobSeekersQueryDto,
  ): Promise<{
    jobSeekers: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = (query.sortOrder ?? 'DESC') as 'ASC' | 'DESC';
    const search =
      typeof query.query === 'string' ? query.query.trim() : undefined;
    const approvalStatus = query.approvalStatus;

    const qb = this.profileRepo
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.auth', 'auth')
      .leftJoinAndSelect('profile.userSkills', 'userSkills')
      .leftJoinAndSelect('userSkills.skill', 'skill')
      .leftJoinAndSelect('profile.cvDocument', 'cvDocument')
      .leftJoinAndSelect('profile.profilePicture', 'profilePicture');

    if (search) {
      qb.andWhere(
        '(profile.firstName ILIKE :search OR profile.lastName ILIKE :search OR profile.email ILIKE :search OR auth.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (approvalStatus) {
      qb.andWhere('profile.approvalStatus = :approvalStatus', {
        approvalStatus,
      });
    }

    const orderField = [
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
    ].includes(sortBy)
      ? `profile.${sortBy}`
      : 'profile.createdAt';
    qb.orderBy(orderField, sortOrder);
    qb.skip(skip).take(limit);

    const [profiles, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);
    const jobSeekers = profiles.map((profile) => ({
      id: profile.id,
      email: profile.auth?.email ?? profile.email,
      profile: profile,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));

    return { jobSeekers, total, page, limit, totalPages };
  }

  async getJobSeekerById(jobSeekerId: string, adminId: string): Promise<any> {
    // Verify admin has permission (you can add admin verification logic here)
    const profile = await this.profileRepo.findOne({
      where: { id: jobSeekerId },
      relations: [
        'auth',
        'userSkills',
        'userSkills.skill',
        'cvDocument',
        'profilePicture',
        'applications',
        'applications.job',
        'applications.job.employer',
      ],
    });

    if (!profile) {
      throw new NotFoundException('Job seeker not found');
    }

    return {
      id: profile.id,
      email: profile.auth.email,
      profile: profile,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
