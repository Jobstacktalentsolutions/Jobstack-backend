import { ConfigService } from '@nestjs/config';
import { ENV } from '../../config/env.config';

export type StorageConfig = {
  allowedMimeTypes: string[];
  idrive: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBucket: string;
    privateBucket: string;
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
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/markdown',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
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
    },
    cloudinary: {
      cloudName: configService.get<string>('CLOUDINARY_CLOUD_NAME') as string,
      apiKey: configService.get<string>('CLOUDINARY_API_KEY') as string,
      apiSecret: configService.get<string>('CLOUDINARY_API_SECRET') as string,
    },
  };
};
