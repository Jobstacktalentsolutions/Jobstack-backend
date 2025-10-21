import { ConfigService } from '@nestjs/config';
import { ENV } from '../../../../../apps/api/src/modules/config/env.config';

export type StorageConfig = {
  allowedMimeTypes: string[];
  [StorageProviders.IDRIVE]: {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    publicBucket: string;
    privateBucket: string;
  };
  // [StorageProviders.CLOUDINARY]: {
  //   cloudName: string;
  //   apiKey: string;
  //   apiSecret: string;
  // };
};

export enum StorageProviders {
  IDRIVE = 'idrive',
  // CLOUDINARY = 'cloudinary',
}

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
    [StorageProviders.IDRIVE]: {
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
  };
};
