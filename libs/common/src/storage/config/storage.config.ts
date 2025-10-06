import { ConfigService } from '@nestjs/config';
import { StorageProviderType } from '../interfaces/storage.interface';
import { ENV } from '../../config/env.config';

export type StorageConfig = {
  provider: StorageProviderType;
  maxFileSize: number;
  allowedMimeTypes: string[];
  idrive: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBucket: string;
    privateBucket: string;
    publicBaseUrl?: string; // optional CDN/public base url
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
};

export const createStorageConfig = (
  configService: ConfigService,
): StorageConfig => {
  return {
    provider:
      (configService.get<string>(
        ENV.STORAGE_PROVIDER,
      ) as StorageProviderType) || 'idrive',
    maxFileSize: Number(
      configService.get<string>(ENV.STORAGE_MAX_FILE_SIZE) || 10 * 1024 * 1024,
    ),
    allowedMimeTypes: (configService
      .get<string>(ENV.STORAGE_ALLOWED_MIME)
      ?.split(',') || [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/markdown',
    ]) as string[],
    idrive: {
      endpoint: configService.get<string>(ENV.IDRIVE_ENDPOINT) as string,
      region:
        (configService.get<string>(ENV.IDRIVE_REGION) as string) || 'us-east-1',
      accessKeyId: configService.get<string>(
        ENV.IDRIVE_ACCESS_KEY_ID,
      ) as string,
      secretAccessKey: configService.get<string>(
        ENV.IDRIVE_SECRET_ACCESS_KEY,
      ) as string,
      publicBucket: configService.get<string>(
        ENV.IDRIVE_PUBLIC_BUCKET,
      ) as string,
      privateBucket: configService.get<string>(
        ENV.IDRIVE_PRIVATE_BUCKET,
      ) as string,
      publicBaseUrl:
        configService.get<string>(ENV.IDRIVE_PUBLIC_BASE_URL) || undefined,
    },
    cloudinary: {
      cloudName: configService.get<string>('CLOUDINARY_CLOUD_NAME') as string,
      apiKey: configService.get<string>('CLOUDINARY_API_KEY') as string,
      apiSecret: configService.get<string>('CLOUDINARY_API_SECRET') as string,
    },
  };
};
