import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  MulterFile,
  UploadOptions,
  UploadResult,
} from '../interfaces/storage.interface';
import { lookup as lookupMime } from 'mime-types';

export class IDriveProvider implements IStorageProvider {
  private s3: S3Client;
  private endpoint: string;
  private region: string;
  private publicBaseUrl?: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('IDRIVE_ENDPOINT') as string;
    this.region =
      (this.configService.get<string>('IDRIVE_REGION') as string) ||
      'us-east-1';
    const accessKeyId = this.configService.get<string>(
      'IDRIVE_ACCESS_KEY_ID',
    ) as string;
    const secretAccessKey = this.configService.get<string>(
      'IDRIVE_SECRET_ACCESS_KEY',
    ) as string;
    this.publicBaseUrl =
      this.configService.get<string>('IDRIVE_PUBLIC_BASE_URL') || undefined;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('IDrive credentials are missing in ENV');
    }

    this.s3 = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async uploadFile(
    file: MulterFile,
    options: UploadOptions,
  ): Promise<UploadResult> {
    const contentType =
      file.mimetype ||
      lookupMime(options.fileName) ||
      'application/octet-stream';

    const key = `${options.folder}/${options.fileName}`.replace(/\\/g, '/');

    const put = new PutObjectCommand({
      Bucket: options.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: contentType as string,
      Metadata: {
        originalName: file.originalname,
      },
    });

    await this.s3.send(put);

    const url = this.getPublicFileUrl(key, options.bucket);

    return {
      fileKey: key,
      url,
      size: file.size,
      mimeType: contentType as string,
      originalName: file.originalname,
    };
  }

  async getSignedFileUrl(
    fileKey: string,
    bucket: string,
    expiresInSeconds: number,
  ): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
    return await getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });
  }

  getPublicFileUrl(fileKey: string, bucket: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${fileKey}`;
    }
    const endpoint = this.endpoint.replace(/\/$/, '');
    return `${endpoint}/${bucket}/${fileKey}`;
  }

  async deleteFile(fileKey: string, bucket: string): Promise<void> {
    const del = new DeleteObjectCommand({ Bucket: bucket, Key: fileKey });
    await this.s3.send(del);
  }
}
