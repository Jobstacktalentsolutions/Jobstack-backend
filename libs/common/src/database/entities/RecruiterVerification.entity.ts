import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RecruiterProfile } from './RecruiterProfile.entity';
import { RecruiterType } from 'apps/api/src/modules/auth/submodules/recruiter/dto/recruiter-auth.dto';
import {
  RecruiterDocumentType,
  VerificationStatus,
} from '@app/common/shared/enums/recruiter-docs.enum';

@Entity('recruiter_verification')
export class RecruiterVerification extends BaseEntity {
  @Column('uuid')
  recruiterId: string;

  @OneToOne(() => RecruiterProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recruiterId' })
  recruiter: RecruiterProfile;

  @Column({ type: 'enum', enum: RecruiterType })
  submissionType: RecruiterType;

  @Column({ type: 'enum', enum: RecruiterDocumentType })
  documentType: RecruiterDocumentType;

  @Column({ nullable: true })
  documentNumber?: string;

  @Column()
  documentFileUrl: string;

  @Column({ nullable: true })
  proofOfAddressUrl?: string;

  @Column({ nullable: true })
  businessAddress?: string;

  @Column({ nullable: true })
  tin?: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column('uuid', { nullable: true })
  reviewedByAdminId?: string;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  // Future automation hooks
  @Column({ nullable: true })
  externalProvider?: string;

  @Column({ nullable: true })
  externalCheckId?: string;

  @Column({ type: 'jsonb', nullable: true })
  externalRaw?: Record<string, any>;
}
