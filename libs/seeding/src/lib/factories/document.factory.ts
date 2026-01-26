import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { Document } from '@app/common/database/entities/Document.entity';
import { CONSTANT_IDS } from '../data/constant.data';
import { StorageProviders } from '@app/common/storage/config/storage.config';
import { DocumentType } from '@app/common/database/entities/schema.enum';
import * as fs from 'fs';
import * as path from 'path';
import { IDriveProvider } from '@app/common/storage/providers/idrive.provider';
import { ConfigService } from '@nestjs/config';
import { ENV } from '../../../../../apps/api/src/modules/config/env.config';
import { config } from 'dotenv';
config();
// Simple ConfigService wrapper for seeding context
class SeedingConfigService implements Partial<ConfigService> {
  get<T = any>(key: string): T | undefined {
    return process.env[key] as T;
  }
}

export class DocumentFactory extends BaseFactory<Document> {
  private readonly docsPath: string;
  private readonly configService: ConfigService;
  private readonly storageProvider: IDriveProvider;

  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'Document'), {
      defaultAttributes: () => ({}),
    });

    // Path to temp/docs directory relative to backend root
    // Try multiple possible paths to handle different execution contexts
    const possiblePaths = [
      path.join(process.cwd(), 'temp', 'docs'), // From backend root
      path.join(process.cwd(), '..', 'temp', 'docs'), // From libs/seeding
      path.join(__dirname, '..', '..', '..', '..', '..', 'temp', 'docs'), // From compiled dist
    ];

    // Use the first path that exists, or default to process.cwd()
    this.docsPath =
      possiblePaths.find((p) => {
        try {
          return fs.existsSync(p);
        } catch {
          return false;
        }
      }) || possiblePaths[0];

    // Create a simple config service wrapper
    this.configService = new SeedingConfigService() as any;
    this.storageProvider = new IDriveProvider(this.configService);
  }

  // Read PDF files from temp/docs directory
  private async readPdfFiles(): Promise<
    Array<{ name: string; buffer: Buffer }>
  > {
    const files: Array<{ name: string; buffer: Buffer }> = [];

    try {
      if (!fs.existsSync(this.docsPath)) {
        console.warn(`⚠️  Documents directory not found: ${this.docsPath}`);
        return files;
      }

      const fileNames = fs.readdirSync(this.docsPath);
      const pdfFiles = fileNames.filter((name) =>
        name.toLowerCase().endsWith('.pdf'),
      );

      for (const fileName of pdfFiles) {
        const filePath = path.join(this.docsPath, fileName);
        const buffer = fs.readFileSync(filePath);
        files.push({ name: fileName, buffer });
      }

      console.log(`📄 Found ${files.length} PDF file(s) in temp/docs`);
      return files;
    } catch (error) {
      console.error(`❌ Error reading PDF files: ${error.message}`);
      return files;
    }
  }

  // Upload a file to S3 and return document data
  private async uploadFileToS3(
    file: { name: string; buffer: Buffer },
    documentId: string,
    fileName: string,
    description: string,
  ): Promise<Partial<Document>> {
    try {
      // Create MulterFile-like object
      const multerFile = {
        buffer: file.buffer,
        originalname: file.name,
        mimetype: 'application/pdf',
        size: file.buffer.length,
        fieldname: 'document',
        encoding: '7bit',
      } as any;

      // Determine bucket (use private for employer verification documents)
      const bucket =
        this.configService.get<string>(ENV.S3_PRIVATE_BUCKET) || '';

      // Upload file
      const uploadResult = await this.storageProvider.uploadFile(multerFile, {
        fileName: `${documentId}.pdf`,
        folder: 'seed/documents',
        bucket,
        sanitizedOriginalName: file.name,
      });

      return {
        fileKey: uploadResult.fileKey,
        fileName: `${documentId}.pdf`,
        originalName: file.name,
        mimeType: 'application/pdf',
        size: file.buffer.length,
        url: uploadResult.url,
        type: DocumentType.OTHER,
        description,
        bucketType: 'private' as const,
        provider: StorageProviders.IDRIVE,
        isActive: true,
      };
    } catch (error) {
      console.error(`❌ Error uploading file ${file.name}: ${error.message}`);
      throw error;
    }
  }

  // createAll upserts all document seed records with real PDFs
  async createAll(): Promise<Document[]> {
    console.log('🔄 Upserting document records with real PDFs...');

    // Read PDF files from temp/docs
    const pdfFiles = await this.readPdfFiles();

    if (pdfFiles.length === 0) {
      console.warn(
        '⚠️  No PDF files found in temp/docs. Creating placeholder documents.',
      );
      // Fallback to creating placeholder documents if no files found
      return await this.createPlaceholderDocuments();
    }

    const documents: Document[] = [];
    const documentIds = CONSTANT_IDS.DOCUMENTS;

    // Reuse PDF files for multiple document records
    // Cycle through available PDFs
    for (let i = 0; i < documentIds.length; i++) {
      const documentId = documentIds[i];
      const pdfFile = pdfFiles[i % pdfFiles.length]; // Cycle through available PDFs

      try {
        // Generate description based on index
        const descriptions = [
          'CAC registration certificate',
          'Tax identification certificate',
          'CAC certificate',
          'Proof of address',
          'Utility bill',
          'Office lease agreement',
          'Business registration document',
          'Tax certificate',
          'Address verification document',
          'Company registration document',
        ];
        const description =
          descriptions[i % descriptions.length] ||
          'Employer verification document';

        // Upload file to S3
        const documentData = await this.uploadFileToS3(
          pdfFile,
          documentId,
          `${documentId}.pdf`,
          description,
        );

        // Create or update document record
        const doc = await this.smartUpsert(
          {
            id: documentId,
            ...documentData,
          },
          ['id'],
        );

        documents.push(doc);
        console.log(
          `✅ Uploaded and saved document: ${documentId} (${pdfFile.name})`,
        );
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert document: ${documentId}`,
          error.message,
        );
      }
    }

    console.log(
      `✅ Upserted ${documents.length} document records with real PDFs`,
    );
    return documents;
  }

  // Fallback method to create placeholder documents if no PDFs found
  private async createPlaceholderDocuments(): Promise<Document[]> {
    const documents: Document[] = [];
    const documentIds = CONSTANT_IDS.DOCUMENTS;

    for (const documentId of documentIds) {
      try {
        const doc = await this.smartUpsert(
          {
            id: documentId,
            fileKey: `seed/documents/${documentId}.pdf`,
            fileName: `${documentId}.pdf`,
            originalName: 'placeholder.pdf',
            mimeType: 'application/pdf',
            size: 0,
            url: `https://placeholder/${documentId}.pdf`,
            type: DocumentType.OTHER,
            description: 'Placeholder document',
            bucketType: 'private' as const,
            provider: StorageProviders.IDRIVE,
            isActive: true,
          },
          ['id'],
        );
        documents.push(doc);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert placeholder document: ${documentId}`,
          error.message,
        );
      }
    }

    return documents;
  }
}
