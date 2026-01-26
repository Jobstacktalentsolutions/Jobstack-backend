import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { ENV } from '../../../../../apps/api/src/modules/config/env.config';
import {
  IStorageProvider,
  UploadOptions,
  UploadResult,
} from '../interfaces/storage.interface';
import { lookup as lookupMime } from 'mime-types';
import { MulterFile } from '@app/common/shared/types';
export class IDriveProvider implements IStorageProvider {
  private s3: S3Client;
  private endpoint: string;
  private region: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>(ENV.S3_ENDPOINT) as string;
    this.region =
      (this.configService.get<string>(ENV.S3_REGION) as string) || 'auto';
    const accessKeyId = this.configService.get<string>(
      ENV.S3_ACCESS_KEY_ID,
    ) as string;
    const secretAccessKey = this.configService.get<string>(
      ENV.S3_SECRET_ACCESS_KEY,
    ) as string;

    // Ensure endpoint has proper protocol
    if (
      !this.endpoint.startsWith('http://') &&
      !this.endpoint.startsWith('https://')
    ) {
      this.endpoint = `https://${this.endpoint}`;
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
    try {
      const contentType =
        file.mimetype ||
        lookupMime(options.fileName) ||
        'application/octet-stream';

      const key = `${options.folder}/${options.fileName}`.replace(/\\/g, '/');

      // Use sanitized filename from service or fallback to original
      const sanitizedOriginalName =
        options.sanitizedOriginalName || file.originalname;

      console.log('Uploading to S3:', {
        bucket: options.bucket,
        key,
        contentType,
        fileSize: file.size,
        endpoint: this.endpoint,
      });

      const put = new PutObjectCommand({
        Bucket: options.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType as string,
        Metadata: {
          originalName: sanitizedOriginalName,
        },
      });

      await this.s3.send(put);

      const url = await this.getSignedFileUrl(
        key,
        options.bucket,
        60 * 60 * 24 * 7,
      );

      console.log('Upload successful:', { key, url });

      return {
        fileKey: key,
        url,
        size: file.size,
        mimeType: contentType as string,
        originalName: file.originalname,
      };
    } catch (error) {
      console.error('S3 Upload failed:', {
        error: error.message,
        errorName: error.name,
        statusCode: error.$metadata?.httpStatusCode,
        bucket: options.bucket,
        endpoint: this.endpoint,
        originalName: file.originalname,
      });

      // Provide more helpful error messages
      if (error.name === 'NoSuchBucket') {
        throw new Error(
          `S3 bucket '${options.bucket}' does not exist. Please check your configuration.`,
        );
      }
      if (
        error.name === 'InvalidAccessKeyId' ||
        error.name === 'SignatureDoesNotMatch'
      ) {
        throw new Error(
          'S3 authentication failed. Please check your access key and secret key.',
        );
      }
      if (error.$metadata?.httpStatusCode === 403) {
        throw new Error(
          'S3 access denied. Please check your bucket permissions.',
        );
      }

      throw new Error(`S3 upload failed: ${error.message}`);
    }
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
    if (!this.endpoint) {
      throw new Error('S3 endpoint is not configured');
    }
    if (!bucket) {
      throw new Error('Bucket name is required');
    }
    if (!fileKey) {
      throw new Error('File key is required');
    }

    const endpoint = this.endpoint.replace(/\/$/, '');
    return `${endpoint}/${bucket}/${fileKey}`;
  }

  async deleteFile(fileKey: string, bucket: string): Promise<void> {
    const del = new DeleteObjectCommand({ Bucket: bucket, Key: fileKey });
    await this.s3.send(del);
  }
}
