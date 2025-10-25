import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RecruiterProfile } from './RecruiterProfile.entity';
import { RecruiterVerificationDocument } from './RecruiterVerificationDocument.entity';
import { VerificationStatus } from '@app/common/shared/enums/recruiter-docs.enum';

@Entity('recruiter_verification')
export class RecruiterVerification extends BaseEntity {
  @Column('uuid')
  recruiterId: string;

  @OneToOne(() => RecruiterProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recruiterId' })
  recruiter: RecruiterProfile;

  @OneToMany(
    () => RecruiterVerificationDocument,
    (doc) => doc.verification,
    { cascade: true },
  )
  documents: RecruiterVerificationDocument[];

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  companyAddress?: string;

  @Column({ nullable: true })
  companySize?: string;

  @Column({ nullable: true })
  socialOrWebsiteUrl?: string;

  @Column({ nullable: true })
  businessAddress?: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  status: VerificationStatus;

  @Column('uuid', { nullable: true })
  reviewedByAdminId?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;
}
