import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';
import { Document } from './Document.entity';
import {
  JobseekerDocumentType,
  JobseekerVerificationDocumentKind,
} from '@app/common/shared/enums/jobseeker-docs.enum';
import { VerificationDocumentStatus } from '@app/common/shared/enums/verification-document-status.enum';

@Entity('jobseeker_verification_documents')
@Unique(['jobseekerProfileId', 'documentKind'])
export class JobseekerVerificationDocument extends BaseEntity {
  @Column('uuid')
  jobseekerProfileId: string;

  @ManyToOne(() => JobSeekerProfile, (p) => p.verificationDocuments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'jobseekerProfileId' })
  jobseekerProfile: JobSeekerProfile;

  @Column('uuid')
  documentId: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({
    type: 'enum',
    enum: JobseekerVerificationDocumentKind,
    enumName: 'jobseeker_verification_document_kind_enum',
  })
  documentKind: JobseekerVerificationDocumentKind;

  @Column({
    type: 'enum',
    enum: JobseekerDocumentType,
    enumName: 'jobseeker_profiles_iddocumenttype_enum',
    nullable: true,
  })
  idSubtype?: JobseekerDocumentType;

  @Column({ type: 'varchar', nullable: true })
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
