import { MulterFile } from '@app/common/shared/types';
export interface UploadOptions {
  fileName: string;
  folder: string;
  bucket: string;
  sanitizedOriginalName?: string;
}

export interface UploadResult {
  fileKey: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface IStorageProvider {
  // Upload file to provider
  uploadFile(file: MulterFile, options: UploadOptions): Promise<UploadResult>;

  // Get a signed url for private object
  getSignedFileUrl(
    fileKey: string,
    bucket: string,
    expiresInSeconds: number,
  ): Promise<string>;

  // Get public url for object
  getPublicFileUrl(fileKey: string, bucket: string): string;

  // Delete object
  deleteFile(fileKey: string, bucket: string): Promise<void>;
}
