import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { getRepositoryByName } from '../utils/repository.utils';
import { Document } from '@app/common/database/entities/Document.entity';
import { DOCUMENTS_DATA } from '../data/documents.data';

export class DocumentFactory extends BaseFactory<Document> {
  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'Document'), {
      defaultAttributes: () => ({}),
    });
  }

  // createAll upserts all document seed records
  async createAll(): Promise<Document[]> {
    console.log('🔄 Upserting document records...');

    const documents: Document[] = [];
    for (const docData of DOCUMENTS_DATA) {
      try {
        const doc = await this.smartUpsert(docData, ['id']);
        documents.push(doc);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert document: ${docData.id}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${documents.length} document records`);
    return documents;
  }
}
