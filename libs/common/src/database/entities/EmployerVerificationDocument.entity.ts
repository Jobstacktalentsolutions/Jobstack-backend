import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Document } from './Document.entity';
import { EmployerDocumentType } from '@app/common/shared/enums/employer-docs.enum';
import { VerificationDocumentStatus } from '@app/common/shared/enums/verification-document-status.enum';
import { EmployerProfile } from './EmployerProfile.entity';

@Entity('employer_verification_documents')
export class EmployerVerificationDocument extends BaseEntity {
  @Column('uuid')
  employerProfileId: string;

  @ManyToOne(
    () => EmployerProfile,
    (employerProfile) => employerProfile.verificationDocuments,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'employerProfileId' })
  employerProfile: EmployerProfile;

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
