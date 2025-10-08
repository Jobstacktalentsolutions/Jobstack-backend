import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobSeekerProfile } from '@app/common/database/entities/JobseekerProfile.entity';
import { JobseekerAuth } from '@app/common/database/entities/JobseekerAuth.entity';
import { StorageService } from '@app/common/storage/storage.service';
import type { MulterFile } from '@app/common/shared/types';

@Injectable()
export class JobseekerProfileService {
  constructor(
    @InjectRepository(JobSeekerProfile)
    protected readonly profileRepo: Repository<JobSeekerProfile>,
    @InjectRepository(JobseekerAuth)
    protected readonly authRepo: Repository<JobseekerAuth>,
    protected readonly storageService: StorageService,
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
}
