import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createStorageConfig, StorageConfig } from './config/storage.config';
import { IDriveProvider } from './providers/idrive.provider';
import { IStorageProvider } from './interfaces/storage.interface';
import { MulterFile } from '@app/common/shared/types';
import { Document, DocumentType } from '../database/entities';
import { StorageProviders } from './config/storage.config';
@Injectable()
export class StorageService {
  private readonly storageConfig: StorageConfig;
  private readonly logger = new Logger(StorageService.name);
  private readonly providers: Record<StorageProviders, IStorageProvider>;
  private static readonly DEFAULT_PROVIDER: StorageProviders =
    StorageProviders.IDRIVE;
  private static readonly MAX_FILE_SIZE_BYTES: number = 10 * 1024 * 1024; // 10 MB

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {
    this.storageConfig = createStorageConfig(this.configService);
    this.providers = {
      [StorageProviders.IDRIVE]: new IDriveProvider(this.configService),
    };
  }

  // Select active provider
  private getProvider(provider?: StorageProviders): IStorageProvider {
    const key = provider || StorageService.DEFAULT_PROVIDER;
    return this.providers[key];
  }

  // Upload file with validation and provider selection
  async uploadFile(
    file: MulterFile,
    options: {
      fileName?: string;
      folder?: string;
      bucketType?: 'public' | 'private';
      provider?: StorageProviders;
      documentType?: DocumentType;
      uploadedBy?: string;
      description?: string;
    } = {},
  ): Promise<{
    document: Document;
    fileKey: string;
    url: string;
    size: number;
    mimeType: string;
    originalName: string;
    bucketType: 'public' | 'private';
  }> {
    this.logger.log('Starting file upload', {
      originalName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      bucketType: options.bucketType || 'private',
      provider: options.provider || StorageService.DEFAULT_PROVIDER,
    });

    this.validateFile(file);

    const fileName =
      options.fileName || this.generateFileName(file.originalname);
    const baseFolder = 'documents';
    const subFolder = options.folder || 'uploads';
    const folder = `${baseFolder}/${subFolder}`;
    const bucketType = options.bucketType || 'private';
    const bucket = this.getBucketForType(bucketType, options.provider);
    const providerInstance = this.getProvider(options.provider);

    // Sanitize filename for metadata headers
    const sanitizedOriginalName = this.sanitizeFilename(file.originalname);

    const uploadResult = await providerInstance.uploadFile(file, {
      fileName,
      folder,
      bucket,
      sanitizedOriginalName,
    });

    // Create document record in database
    const document = this.documentRepository.create({
      fileKey: uploadResult.fileKey,
      fileName,
      originalName: uploadResult.originalName,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
      url: uploadResult.url,
      type: options.documentType || DocumentType.OTHER,
      description: options.description,
      bucketType,
      provider:
        (options.provider || StorageService.DEFAULT_PROVIDER) === 'idrive'
          ? StorageProviders.IDRIVE
          : StorageProviders.IDRIVE,
      uploadedBy: options.uploadedBy,
    });

    const savedDocument = await this.documentRepository.save(document);

    return {
      document: savedDocument,
      fileKey: uploadResult.fileKey,
      url: uploadResult.url,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      originalName: uploadResult.originalName,
      bucketType: bucketType,
    };
  }

  // Get file URL (signed for private, direct for public)
  async getSignedUrl(
    fileKey: string,
    expiry: number,
    forDownload: boolean = false,
    bucketType: 'public' | 'private' = 'public',
    provider?: StorageProviders,
  ): Promise<string> {
    const bucket = this.getBucketForType(bucketType, provider);
    const providerInstance = this.getProvider(provider);
    if (bucketType === 'public') {
      return providerInstance.getPublicFileUrl(fileKey, bucket);
    }
    return await providerInstance.getSignedFileUrl(fileKey, bucket, expiry);
  }

  // Permanently delete file from storage
  async deleteFile(
    fileKey: string,
    bucketType: 'public' | 'private' = 'private',
    provider?: StorageProviders,
  ): Promise<boolean> {
    if (!fileKey) return true;
    const bucket = this.getBucketForType(bucketType, provider);
    const providerInstance = this.getProvider(provider);
    await providerInstance.deleteFile(fileKey, bucket);
    return true;
  }

  // Delete document by ID (permanently removes from storage and database)
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const document = await this.documentRepository.findOne({
        where: { id: documentId, isActive: true },
      });

      if (!document) {
        this.logger.warn(
          `Document with ID ${documentId} not found or already deleted`,
        );
        return false;
      }

      // Delete from storage
      await this.deleteFile(
        document.fileKey,
        document.bucketType,
        document.provider,
      );

      // Permanently delete from database
      await this.documentRepository.remove(document);

      this.logger.log(`Document ${documentId} permanently deleted`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete document ${documentId}:`, error);
      throw new BadRequestException(
        `Failed to delete document: ${error.message}`,
      );
    }
  }

  // Soft delete document (mark as inactive)
  async softDeleteDocument(documentId: string): Promise<boolean> {
    try {
      const result = await this.documentRepository.update(
        { id: documentId, isActive: true },
        { isActive: false },
      );

      if (result.affected === 0) {
        this.logger.warn(
          `Document with ID ${documentId} not found or already deleted`,
        );
        return false;
      }

      this.logger.log(`Document ${documentId} soft deleted`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to soft delete document ${documentId}:`, error);
      throw new BadRequestException(
        `Failed to soft delete document: ${error.message}`,
      );
    }
  }

  // Get document by ID
  async getDocument(documentId: string): Promise<Document | null> {
    return await this.documentRepository.findOne({
      where: { id: documentId, isActive: true },
    });
  }

  // Get documents by type
  async getDocumentsByType(
    type: DocumentType,
    uploadedBy?: string,
  ): Promise<Document[]> {
    const whereCondition: any = { type, isActive: true };
    if (uploadedBy) {
      whereCondition.uploadedBy = uploadedBy;
    }

    return await this.documentRepository.find({
      where: whereCondition,
      order: { createdAt: 'DESC' },
    });
  }

  // Private helper methods
  private validateFile(file: MulterFile): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (file.size > StorageService.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${StorageService.MAX_FILE_SIZE_BYTES} bytes`,
      );
    }
    const allowedTypes = this.storageConfig.allowedMimeTypes;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  // Determine bucket based on bucket type and provider
  private getBucketForType(
    bucketType: 'public' | 'private',
    provider?: StorageProviders,
  ): string {
    const currentProvider = provider || StorageService.DEFAULT_PROVIDER;
    switch (currentProvider) {
      case StorageProviders.IDRIVE:
        return bucketType === 'public'
          ? this.storageConfig.idrive.publicBucket
          : this.storageConfig.idrive.privateBucket;
      default:
        return bucketType === 'public'
          ? this.storageConfig.idrive.publicBucket
          : this.storageConfig.idrive.privateBucket;
    }
  }

  // Sanitize filename for metadata headers
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
      .replace(/[^\w\s.-]/g, '_') // Replace special characters with underscore
      .substring(0, 100); // Limit length
  }

  // Extract file key from a storage URL
  public extractFileKeyFromUrl(url: string): string | null {
    if (!url) {
      this.logger.warn('extractFileKeyFromUrl called with empty URL');
      return null;
    }

    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname || '';
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      return key || null;
    } catch (error) {
      this.logger.warn(`Failed to parse URL: ${url}. Error: ${error.message}`);
      try {
        const parts = url.split('/');
        if (parts.length >= 4) {
          return parts.slice(3).join('/');
        }
        return null;
      } catch (fallbackError) {
        this.logger.warn(
          `Fallback URL parsing also failed: ${fallbackError.message}`,
        );
        return null;
      }
    }
  }
}
