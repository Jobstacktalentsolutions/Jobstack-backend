import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployerProfile } from '@app/common/database/entities/EmployerProfile.entity';
import { Job } from '@app/common/database/entities/Job.entity';
import { EmployerAuth } from '@app/common/database/entities/EmployerAuth.entity';
import { JobApplication } from '@app/common/database/entities/JobApplication.entity';
import { Document } from '@app/common/database/entities';
import { StorageService } from '@app/common/storage/storage.service';
import type { MulterFile } from '@app/common/shared/types';
import {
  DocumentType,
  JobStatus,
} from '@app/common/database/entities/schema.enum';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';
import { UpdateEmployerProfileDto, GetAllEmployersQueryDto } from './dto';

@Injectable()
export class EmployerService {
  constructor(
    @InjectRepository(EmployerProfile)
    protected readonly profileRepo: Repository<EmployerProfile>,
    @InjectRepository(EmployerAuth)
    protected readonly authRepo: Repository<EmployerAuth>,
    @InjectRepository(JobApplication)
    protected readonly jobApplicationRepo: Repository<JobApplication>,
    @InjectRepository(Job)
    protected readonly jobRepo: Repository<Job>,
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
        'verificationDocuments',
        'verificationDocuments.document',
      ],
    });
    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    return profile;
  }

  /**
   * Get a sanitized employer profile intended for public pages.
   * This endpoint must NOT expose private fields like email/phone or documents.
   */
  async getEmployerPublicProfileBySlug(slug: string): Promise<any | null> {
    const profile = await this.profileRepo.findOne({
      where: { slug },
      relations: ['profilePicture'],
    });

    if (!profile) return null;

    const companyName =
      profile.companyName ||
      `${profile.firstName} ${profile.lastName}`.trim();

    const city = profile.city;
    const state = profile.state;
    // Public location: verification city/state only (never street-level profile.address)
    const location =
      city && state
        ? `${city}, ${state}`
        : city || state || 'Location not specified';

    const activeJobCount = await this.jobRepo
      .createQueryBuilder('job')
      .where('job.employerId = :employerId', { employerId: profile.id })
      .andWhere('job.status IN (:...statuses)', {
        statuses: [JobStatus.PUBLISHED, JobStatus.ACTIVE],
      })
      .andWhere(
        '(job.applicationDeadline IS NULL OR job.applicationDeadline > :now)',
        { now: new Date() },
      )
      .getCount();

    let logoUrl: string | null = null;
    if (profile.profilePicture) {
      const signedUrl = await this.storageService.getSignedUrl(
        profile.profilePicture.fileKey,
        3600,
        false,
        profile.profilePicture.bucketType,
      );
      logoUrl = signedUrl;
    }

    return {
      slug: profile.slug,
      companyName,
      location,
      companyDescription: profile.companyDescription,
      companySize: profile.companySize,
      website:
        profile.socialOrWebsiteUrl ||
        profile.companyWebsite ||
        null,
      logoUrl,
      /** Organization, SME, or Individual when set on the profile */
      employerType: profile.type ?? null,
      /** ISO timestamp for "on JobStack since" */
      memberSince: profile.createdAt ? profile.createdAt.toISOString() : null,
      /** Live roles visible on the marketplace (not expired by deadline) */
      activeJobCount,
      /** True when employer verification is approved (safe public signal) */
      isVerified: profile.verificationStatus === VerificationStatus.APPROVED,
    };
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
        'verificationDocuments',
        'verificationDocuments.document',
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

  // Admin methods for managing employers (filters, search, sort applied server-side)
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
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const type = query.type;
    const verificationStatus = query.verificationStatus;
    const status = query.status;
    const search =
      typeof query.search === 'string' ? query.search.trim() : undefined;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'DESC';

    const queryBuilder = this.profileRepo
      .createQueryBuilder('employer')
      .leftJoinAndSelect('employer.auth', 'auth')
      .leftJoinAndSelect('employer.profilePicture', 'profilePicture')
      .loadRelationCountAndMap('employer.jobsCount', 'employer.jobs')
      .loadRelationCountAndMap('employer.employeesCount', 'employer.employees');

    if (type) {
      queryBuilder.andWhere('employer.type = :employerType', {
        employerType: type,
      });
    }

    if (verificationStatus) {
      queryBuilder.andWhere(
        'employer.verificationStatus = :verificationStatus',
        {
        verificationStatus,
        },
      );
    }

    if (status) {
      queryBuilder.andWhere('employer.status = :status', {
        status,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(employer.firstName ILIKE :search OR employer.lastName ILIKE :search OR employer.email ILIKE :search OR employer.companyName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const orderField = [
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
    ].includes(sortBy)
      ? `employer.${sortBy}`
      : 'employer.createdAt';
    queryBuilder.orderBy(orderField, sortOrder);
    queryBuilder.skip(skip).take(limit);

    const [employers, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      employers: employers.map((profile) => ({
        id: profile.id,
        email: profile.auth?.email,
        profile: profile,
        verification: {
          status: profile.verificationStatus,
          reviewedAt: profile.reviewedAt,
          rejectionReason: profile.verificationRejectionReason,
          documents: profile.verificationDocuments ?? [],
        },
        jobsCount: (profile as any).jobsCount ?? 0,
        employeesCount: (profile as any).employeesCount ?? 0,
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
        'verificationDocuments',
        'verificationDocuments.document',
        'jobs',
        'employees',
      ],
    });

    if (!profile) {
      throw new NotFoundException('Employer not found');
    }

    // Calculate metrics
    const totalJobsPosted = profile.jobs?.length || 0;
    const totalApplicants = await this.jobApplicationRepo
      .createQueryBuilder('application')
      .innerJoin('application.job', 'job')
      .where('job.employerId = :employerId', { employerId })
      .getCount();
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
