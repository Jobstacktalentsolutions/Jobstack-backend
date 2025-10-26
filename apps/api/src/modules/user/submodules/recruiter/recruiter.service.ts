import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { RecruiterProfile } from '@app/common/database/entities/RecruiterProfile.entity';
import { RecruiterAuth } from '@app/common/database/entities/RecruiterAuth.entity';
import { RecruiterVerification } from '@app/common/database/entities/RecruiterVerification.entity';
import { StorageService } from '@app/common/storage/storage.service';
import type { MulterFile } from '@app/common/shared/types';
import { DocumentType } from '@app/common/database/entities/schema.enum';
import { UpdateRecruiterProfileDto, GetAllRecruitersQueryDto } from './dto';

@Injectable()
export class RecruiterService {
  constructor(
    @InjectRepository(RecruiterProfile)
    protected readonly profileRepo: Repository<RecruiterProfile>,
    @InjectRepository(RecruiterAuth)
    protected readonly authRepo: Repository<RecruiterAuth>,
    @InjectRepository(RecruiterVerification)
    protected readonly verificationRepo: Repository<RecruiterVerification>,
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
    if (auth.profile.profilePictureId) {
      await this.deleteCompanyLogo(userId);
    }

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `recruiters/${auth.profile.id}/company-logo`,
      bucketType: 'public',
      documentType: DocumentType.PROFILE_PICTURE,
      uploadedBy: userId,
      description: 'Company logo',
    });

    auth.profile.profilePicture = upload.document;
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

    const currentDocumentId = auth.profile.profilePictureId;
    if (!currentDocumentId) return;

    // Delete document using StorageService
    await this.storageService.deleteDocument(currentDocumentId);

    auth.profile.profilePicture = undefined;
    auth.profile.profilePictureId = undefined;
    await this.profileRepo.save(auth.profile);
  }

  /**
   * Get recruiter profile with company information
   */
  async getRecruiterProfile(userId: string): Promise<any> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.profilePicture'],
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
  async updateRecruiterProfile(
    userId: string,
    updateData: UpdateRecruiterProfileDto,
  ): Promise<any> {
    const auth = await this.authRepo.findOne({
      where: { id: userId },
      relations: ['profile', 'profile.profilePicture'],
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

  // Admin methods for managing recruiters
  async getAllRecruiters(
    adminId: string,
    query: GetAllRecruitersQueryDto,
  ): Promise<{
    recruiters: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify admin has permission (you can add admin verification logic here)
    const {
      page = 1,
      limit = 10,
      type,
      verificationStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: FindOptionsWhere<RecruiterProfile> = {};

    if (type) {
      where.type = type;
    }

    // Build query builder for complex queries
    const queryBuilder = this.profileRepo
      .createQueryBuilder('recruiter')
      .leftJoinAndSelect('recruiter.auth', 'auth')
      .leftJoinAndSelect('recruiter.profilePicture', 'profilePicture')
      .leftJoinAndSelect('recruiter.verification', 'verification');

    // Apply type filter
    if (type) {
      queryBuilder.andWhere('recruiter.type = :type', { type });
    }

    // Apply verification status filter
    if (verificationStatus) {
      queryBuilder.andWhere('verification.status = :status', {
        status: verificationStatus,
      });
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(recruiter.firstName LIKE :search OR recruiter.lastName LIKE :search OR recruiter.email LIKE :search OR verification.companyName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const orderField =
      sortBy === 'createdAt' || sortBy === 'updatedAt'
        ? `recruiter.${sortBy}`
        : `recruiter.${sortBy}`;
    queryBuilder.orderBy(orderField, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const recruiters = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      recruiters: recruiters.map((profile) => ({
        id: profile.id,
        email: profile.auth?.email,
        profile: profile,
        verification: profile.verification,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getRecruiterById(recruiterId: string, adminId: string): Promise<any> {
    // Verify admin has permission (you can add admin verification logic here)
    const recruiter = await this.profileRepo.findOne({
      where: { id: recruiterId },
      relations: ['auth', 'profilePicture'],
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    return {
      id: recruiter.id,
      email: recruiter.auth?.email,
      profile: recruiter,
      createdAt: recruiter.createdAt,
      updatedAt: recruiter.updatedAt,
    };
  }
}
