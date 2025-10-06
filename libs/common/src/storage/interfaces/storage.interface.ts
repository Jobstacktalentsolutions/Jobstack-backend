import { Readable } from 'stream';

export type StorageProviderType = 'idrive' | 'cloudinary';

export type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
  stream?: Readable;
};

export interface UploadOptions {
  fileName: string;
  folder: string;
  bucket: string;
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
