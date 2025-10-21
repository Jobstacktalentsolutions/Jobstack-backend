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
    protected readonly storageService: StorageService,
    protected readonly skillsService: SkillsService,
  ) {}

  // Upload and set CV url (PDF-only)
  async uploadCv(userId: string, file: MulterFile): Promise<{ cvUrl: string }> {
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

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `jobseekers/${auth.profile.id}/cv`,
      bucketType: 'private',
    });

    auth.profile.cvUrl = upload.url;
    await this.profileRepo.save(auth.profile);
    return { cvUrl: upload.url };
  }

  // Delete CV and clear cvUrl
  async deleteCv(userId: string): Promise<void> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile)
      throw new NotFoundException('Jobseeker not found');
    const currentUrl = auth.profile.cvUrl;
    if (!currentUrl) return;

    const fileKey = this.storageService.extractFileKeyFromUrl(currentUrl);
    if (fileKey) {
      await this.storageService.deleteFile(fileKey, 'private');
    }

    auth.profile.cvUrl = null as any;
    await this.profileRepo.save(auth.profile);
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
}
