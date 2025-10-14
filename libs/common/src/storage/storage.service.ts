import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createStorageConfig, StorageConfig } from './config/storage.config';
import { IDriveProvider } from './providers/idrive.provider';
import {
  IStorageProvider,
  StorageProviderType,
} from './interfaces/storage.interface';
import { MulterFile } from '@app/common/shared/types';
@Injectable()
export class StorageService {
  private readonly storageConfig: StorageConfig;
  private readonly logger = new Logger(StorageService.name);
  private readonly providers: Record<'idrive', IStorageProvider>;
  private static readonly DEFAULT_PROVIDER: StorageProviderType = 'idrive';
  private static readonly MAX_FILE_SIZE_BYTES: number = 10 * 1024 * 1024; // 10 MB

  constructor(private readonly configService: ConfigService) {
    this.storageConfig = createStorageConfig(this.configService);
    this.providers = {
      idrive: new IDriveProvider(this.configService),
    };
  }

  // Select active provider
  private getProvider(provider?: StorageProviderType): IStorageProvider {
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
      provider?: StorageProviderType;
    } = {},
  ): Promise<{
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

    const uploadResult = await providerInstance.uploadFile(file, {
      fileName,
      folder,
      bucket,
    });

    return {
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
    provider?: StorageProviderType,
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
    provider?: StorageProviderType,
  ): Promise<boolean> {
    if (!fileKey) return true;
    const bucket = this.getBucketForType(bucketType, provider);
    const providerInstance = this.getProvider(provider);
    await providerInstance.deleteFile(fileKey, bucket);
    return true;
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
    provider?: StorageProviderType,
  ): string {
    const currentProvider = provider || StorageService.DEFAULT_PROVIDER;
    switch (currentProvider) {
      case 'idrive':
        return bucketType === 'public'
          ? this.storageConfig.idrive.publicBucket
          : this.storageConfig.idrive.privateBucket;
      default:
        return bucketType === 'public'
          ? this.storageConfig.idrive.publicBucket
          : this.storageConfig.idrive.privateBucket;
    }
  }

  // Extract file key from a storage URL
  public extractFileKeyFromUrl(url: string): string | null {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname || '';
      const key = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      return key || null;
    } catch {
      try {
        const parts = url.split('/');
        if (parts.length >= 4) {
          return parts.slice(3).join('/');
        }
        return null;
      } catch {
        return null;
      }
    }
  }
}
