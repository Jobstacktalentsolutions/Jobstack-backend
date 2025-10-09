import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { StorageService } from '@app/common/storage/storage.service';
import type { MulterFile } from '@app/common/shared/types';

@Injectable()
export class RecruiterService {
  constructor(
    @InjectRepository(RecruiterProfile)
    protected readonly profileRepo: Repository<RecruiterProfile>,
    @InjectRepository(RecruiterAuth)
    protected readonly authRepo: Repository<RecruiterAuth>,
    protected readonly storageService: StorageService,
  ) {}

  /**
   * Upload company logo for recruiter
   */
  async uploadCompanyLogo(
    userId: string,
    file: MulterFile,
  ): Promise<{ logoUrl: string }> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile) {
      throw new NotFoundException('Recruiter not found');
    }

    // Validate file type - only images allowed
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Delete old logo if exists
    if (auth.profile.profilePictureUrl) {
      await this.deleteCompanyLogo(userId);
    }

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `recruiters/${auth.profile.id}/company-logo`,
      bucketType: 'public',
    });

    auth.profile.profilePictureUrl = upload.url;
    await this.profileRepo.save(auth.profile);
    return { logoUrl: upload.url };
  }

  /**
   * Delete company logo
   */
  async deleteCompanyLogo(userId: string): Promise<void> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile) {
      throw new NotFoundException('Recruiter not found');
    }

    const currentUrl = auth.profile.profilePictureUrl;
    if (!currentUrl) return;

    const fileKey = this.storageService.extractFileKeyFromUrl(currentUrl);
    if (fileKey) {
      await this.storageService.deleteFile(fileKey, 'public');
    }

    auth.profile.profilePictureUrl = null as any;
    await this.profileRepo.save(auth.profile);
  }

  /**
   * Get recruiter profile with company information
   */
  async getRecruiterProfile(userId: string): Promise<any> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile) {
      throw new NotFoundException('Recruiter not found');
    }

    return {
      id: auth.id,
      email: auth.email,
      profile: auth.profile,
      createdAt: auth.createdAt,
      updatedAt: auth.updatedAt,
    };
  }

  /**
   * Update recruiter profile
   */
  async updateRecruiterProfile(userId: string, updateData: any): Promise<any> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!auth || !auth.profile) {
      throw new NotFoundException('Recruiter not found');
    }

    // Update profile data
    Object.assign(auth.profile, updateData);
    await this.profileRepo.save(auth.profile);

    // Update auth data if email is provided
    if (updateData.email) {
      auth.email = updateData.email;
      await this.authRepo.save(auth);
    }

    return this.getRecruiterProfile(userId);
  }
}
