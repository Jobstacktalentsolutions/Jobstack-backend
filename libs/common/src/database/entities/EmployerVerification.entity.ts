import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerProfile } from './EmployerProfile.entity';
import { EmployerVerificationDocument } from './EmployerVerificationDocument.entity';
import { VerificationStatus } from '@app/common/shared/enums/employer-docs.enum';

@Entity('employer_verification')
export class EmployerVerification extends BaseEntity {
  @Column('uuid')
  employerId: string;

  @OneToOne(() => EmployerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employerId' })
  employer: EmployerProfile;

  @OneToMany(() => EmployerVerificationDocument, (doc) => doc.verification, {
    cascade: true,
  })
  documents: EmployerVerificationDocument[];

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  companyAddress?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  companySize?: string;

  @Column({ nullable: true })
  socialOrWebsiteUrl?: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.NOT_STARTED,
  })
  status: VerificationStatus;

  @Column('uuid', { nullable: true })
  reviewedByAdminId?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;
}
