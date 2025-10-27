import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RecruiterVerification } from './RecruiterVerification.entity';
import { Document } from './Document.entity';
import { RecruiterDocumentType } from '@app/common/shared/enums/recruiter-docs.enum';

@Entity('recruiter_verification_documents')
export class RecruiterVerificationDocument extends BaseEntity {
  @Column('uuid')
  verificationId: string;

  @ManyToOne(
    () => RecruiterVerification,
    (verification) => verification.documents,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'verificationId' })
  verification: RecruiterVerification;

  @Column('uuid')
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'enum', enum: RecruiterDocumentType })
  documentType: RecruiterDocumentType;

  @Column({ nullable: true })
  documentNumber?: string;

  @Column({ default: false })
  verified: boolean;
}
