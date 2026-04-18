import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerVerification } from './EmployerVerification.entity';
import { Document } from './Document.entity';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';
import { VerificationDocumentStatus } from '@app/common/shared/enums/verification-document-status.enum';

@Entity('employer_verification_documents')
export class EmployerVerificationDocument extends BaseEntity {
  @Column('uuid')
  verificationId: string;

  @ManyToOne(
    () => EmployerVerification,
    (verification) => verification.documents,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'verificationId' })
  verification: EmployerVerification;

  @Column('uuid')
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'enum', enum: EmployerDocumentType })
  documentType: EmployerDocumentType;

  @Column({ nullable: true })
  documentNumber?: string;

  @Column({
    type: 'enum',
    enum: VerificationDocumentStatus,
    enumName: 'verification_document_status_enum',
    default: VerificationDocumentStatus.PENDING,
  })
  status: VerificationDocumentStatus;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason?: string;

  @Column('uuid', { nullable: true })
  reviewedByAdminId?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;
}
