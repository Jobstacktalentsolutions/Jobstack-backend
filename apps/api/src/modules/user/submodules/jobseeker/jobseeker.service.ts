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
import { Document, DocumentType } from '@app/common/database/entities';
import { StorageService } from '@app/common/storage/storage.service';
import { SkillsService } from 'apps/api/src/modules/skills/skills.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { MulterFile } from '@app/common/shared/types';

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
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile)
      throw new NotFoundException('Jobseeker not found');

    // Enforce PDF mimetype
    const mime = (file.mimetype || '').toLowerCase();
    if (mime !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    // Delete existing CV if it exists
    if (auth.profile.cvDocumentId) {
      await this.deleteCv(userId);
    }

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `jobseekers/${auth.profile.id}/cv`,
      bucketType: 'private',
      documentType: DocumentType.CV,
      uploadedBy: userId,
      description: 'Job seeker CV',
    });

    auth.profile.cvDocumentId = upload.document.id;
    await this.profileRepo.save(auth.profile);

    return {
      cvUrl: upload.url,
      documentId: upload.document.id,
    };
  }

  // Delete CV document (cvDocumentId will be automatically set to null by database)
  async deleteCv(userId: string): Promise<void> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile)
      throw new NotFoundException('Jobseeker not found');

    const currentDocumentId = auth.profile.cvDocumentId;
    if (!currentDocumentId) return;

    // auth.profile.cvDocumentId = undefined;
    await this.profileRepo.update(
      {
        id: auth.profile.id,
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
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.cvDocument'],
    });
    if (!auth || !auth.profile || !auth.profile.cvDocument) {
      return null;
    }

    const document = auth.profile.cvDocument;
    const signedUrl = await this.storageService.getSignedUrl(
      document.fileKey,
      3600, // 1 hour expiry
      true, // for download
      document.bucketType,
    );

    return { document, signedUrl };
  }

  // Update jobseeker profile with smart skills handling
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<JobSeekerProfile> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile)
      throw new NotFoundException('Jobseeker not found');

    // Update basic profile fields
    if (updateData.jobTitle !== undefined) {
      auth.profile.jobTitle = updateData.jobTitle;
    }
    if (updateData.brief !== undefined) {
      auth.profile.brief = updateData.brief;
    }
    if (updateData.preferredLocation !== undefined) {
      auth.profile.preferredLocation = updateData.preferredLocation;
    }
    if (updateData.address !== undefined) {
      auth.profile.address = updateData.address;
    }

    // Handle skills smartly
    if (updateData.skills || updateData.skillIds) {
      // First, remove existing skills
      await this.jobseekerSkillRepo.delete({
        profileId: auth.profile.id,
      });

      // Normalize and attach skills via SkillsService (non-transactional, best-effort)
      const normalizedIds = new Set<string>(updateData.skillIds ?? []);

      // For free-text names, always insert a SUGGESTED skill
      for (const name of updateData.skills ?? []) {
        const skill = await this.skillsService.insertSuggestedSkill(name);
        normalizedIds.add(skill.id);
      }

      await this.skillsService.attachSkillsToProfile(
        auth.profile.id,
        Array.from(normalizedIds).map((skillId) => ({
          skillId,
        })),
      );
    }

    // Save the updated profile
    const updatedProfile = await this.profileRepo.save(auth.profile);

    // Return profile with relations
    const profileWithRelations = await this.profileRepo.findOne({
      where: { id: updatedProfile.id },
      relations: ['userSkills', 'userSkills.skill'],
    });

    if (!profileWithRelations) {
      throw new NotFoundException('Profile not found after update');
    }

    return profileWithRelations;
  }

  // Get jobseeker profile by user ID
  async getProfile(userId: string): Promise<JobSeekerProfile> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.userSkills', 'profile.userSkills.skill'],
    });
    if (!auth || !auth.profile)
      throw new NotFoundException('Jobseeker not found');

    return auth.profile;
  }

  // Admin methods for managing job seekers
  async getAllJobSeekers(adminId: string): Promise<any[]> {
    // Verify admin has permission (you can add admin verification logic here)
    const jobSeekers = await this.authRepo.find({
      relations: ['profile', 'profile.userSkills', 'profile.userSkills.skill'],
      order: { createdAt: 'DESC' },
    });

    return jobSeekers.map((auth) => ({
      id: auth.id,
      email: auth.email,
      profile: auth.profile,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    }));
  }

  async getJobSeekerById(jobSeekerId: string, adminId: string): Promise<any> {
    // Verify admin has permission (you can add admin verification logic here)
    const jobSeeker = await this.authRepo.findOne({
      where: { id: jobSeekerId },
      relations: ['profile', 'profile.userSkills', 'profile.userSkills.skill'],
    });

    if (!jobSeeker) {
      throw new NotFoundException('Job seeker not found');
    }

    return {
      id: jobSeeker.id,
      email: jobSeeker.email,
      profile: jobSeeker.profile,
      createdAt: jobSeeker.createdAt,
      updatedAt: jobSeeker.updatedAt,
    };
  }
}
