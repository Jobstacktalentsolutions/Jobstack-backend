import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StorageProviders } from '../../storage/config/storage.config';
import { DocumentType } from './schema.enum';
@Entity('documents')
export class Document extends BaseEntity {
  @Column()
  fileKey: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 'private' })
  bucketType: 'public' | 'private';

  @Column({
    default: StorageProviders.IDRIVE,
    type: 'enum',
    enum: StorageProviders,
  })
  provider: StorageProviders;

  @Column({ nullable: true })
  uploadedBy?: string; // User ID who uploaded the document

  @Column({ default: true })
  isActive: boolean;
}
