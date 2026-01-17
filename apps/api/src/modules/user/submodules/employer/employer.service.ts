import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { EmployerVerification } from '@app/common/database/entities/EmployerVerification.entity';
import { Document } from '@app/common/database/entities';
import { StorageService } from '@app/common/storage/storage.service';
import type { MulterFile } from '@app/common/shared/types';
import { DocumentType } from '@app/common/database/entities/schema.enum';
import { UpdateEmployerProfileDto, GetAllEmployersQueryDto } from './dto';

@Injectable()
export class EmployerService {
  constructor(
    @InjectRepository(EmployerProfile)
    protected readonly profileRepo: Repository<EmployerProfile>,
    @InjectRepository(EmployerAuth)
    protected readonly authRepo: Repository<EmployerAuth>,
    @InjectRepository(EmployerVerification)
    protected readonly verificationRepo: Repository<EmployerVerification>,
    protected readonly storageService: StorageService,
  ) {}

  /**
   * Upload company logo for employer
   */
  async uploadCompanyLogo(
    userId: string,
    file: MulterFile,
  ): Promise<{ logoUrl: string }> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) {
      throw new NotFoundException('Employer not found');
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
    if (profile.profilePictureId) {
      await this.deleteCompanyLogo(userId);
    }

    const upload = await this.storageService.uploadFile(file as any, {
      folder: `employers/${profile.id}/company-logo`,
      bucketType: 'public',
      documentType: DocumentType.PROFILE_PICTURE,
      uploadedBy: userId,
      description: 'Company logo',
    });

    profile.profilePicture = upload.document;
    await this.profileRepo.save(profile);
    return { logoUrl: upload.url };
  }

  /**
   * Delete company logo
   */
  async deleteCompanyLogo(userId: string): Promise<void> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
    });
    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    const currentDocumentId = profile.profilePictureId;
    if (!currentDocumentId) return;

    // Delete document using StorageService
    await this.storageService.deleteDocument(currentDocumentId);

    profile.profilePicture = undefined;
    profile.profilePictureId = undefined;
    await this.profileRepo.save(profile);
  }

  /**
   * Get company logo with signed URL
   */
  async getCompanyLogo(
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

  /**
   * Get employer profile with company information and verification
   */
  async getEmployerProfile(userId: string): Promise<any> {
    const profile = await this.profileRepo.findOne({
      where: { id: userId },
      relations: [
        'profilePicture',
        'verification',
        'verification.documents',
        'verification.documents.document',
      ],
    });
    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    return profile;
  }

  /**
   * Update employer profile
   */
  async updateEmployerProfile(
    userId: string,
    updateData: UpdateEmployerProfileDto,
  ): Promise<any> {
    let profile = await this.profileRepo.findOne({
      where: { id: userId },
      relations: [
        'profilePicture',
        'verification',
        'verification.documents',
        'verification.documents.document',
      ],
    });
    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    // Update profile data
    Object.assign(profile, updateData);
    profile = await this.profileRepo.save(profile);

    return profile;
  }

  // Admin methods for managing employers
  async getAllEmployers(
    adminId: string,
    query: GetAllEmployersQueryDto,
  ): Promise<{
    employers: any[];
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
    const where: FindOptionsWhere<EmployerProfile> = {};

    if (type) {
      where.type = type;
    }

    // Build query builder for complex queries
    const queryBuilder = this.profileRepo
      .createQueryBuilder('employer')
      .leftJoinAndSelect('employer.auth', 'auth')
      .leftJoinAndSelect('employer.profilePicture', 'profilePicture')
      .leftJoinAndSelect('employer.verification', 'verification');

    // Apply type filter
    if (type) {
      queryBuilder.andWhere('employer.type = :type', { type });
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
        '(employer.firstName LIKE :search OR employer.lastName LIKE :search OR employer.email LIKE :search OR verification.companyName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const orderField =
      sortBy === 'createdAt' || sortBy === 'updatedAt'
        ? `employer.${sortBy}`
        : `employer.${sortBy}`;
    queryBuilder.orderBy(orderField, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const employers = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      employers: employers.map((profile) => ({
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

  async getEmployerById(employerId: string, adminId: string): Promise<any> {
    // Verify admin has permission (you can add admin verification logic here)
    const profile = await this.profileRepo.findOne({
      where: { id: employerId },
      relations: [
        'auth',
        'profilePicture',
        'verification',
        'verification.documents',
        'verification.documents.document',
        'jobs',
        'employees',
      ],
    });

    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    // Calculate metrics
    const totalJobsPosted = profile.jobs?.length || 0;
    const totalApplicants =
      profile.jobs?.reduce((sum, job) => sum + (job.applicantsCount || 0), 0) ||
      0;
    const totalHires = profile.employees?.length || 0;

    // Attach to profile or return as separate fields (we will return as separate fields mixed into the response)
    // The frontend expects "metrics" inside the view model, but the backend currently returns a flat structure with "profile".
    // We will inject these values into the returned object.

    return {
      id: profile.id,
      email: profile.auth?.email,
      profile: profile,
      metrics: {
        totalJobsPosted,
        totalApplicants,
        totalHires,
        avgTimeToHire: 0, // Placeholder as we don't have this logic yet
      },
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
