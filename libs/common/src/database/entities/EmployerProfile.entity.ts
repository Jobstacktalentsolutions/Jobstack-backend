import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { EmployerAuth } from './EmployerAuth.entity';
import {
  EmployerGender,
  EmployerStatus,
  EmployerType,
  SkillCategory,
} from './schema.enum';
import { Document } from './Document.entity';
import { Job } from './Job.entity';
import { Employee } from './Employee.entity';
import {
  GovernmentIdType,
  VerificationStatus,
} from '@app/common/shared/enums/employer-docs.enum';
import { EmployerVerificationDocument } from './EmployerVerificationDocument.entity';

@Entity('employer_profiles')
export class EmployerProfile {
  @PrimaryColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160, nullable: true })
  /**
   * Public URL slug (jobstack.org/public/employers/[slug]).
   * Generated from `${firstName}_${lastName}` and de-duplicated with random suffix.
   */
  slug?: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @ManyToOne(() => Document, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profilePictureId' })
  profilePicture?: Document;

  @Column('uuid', { nullable: true })
  profilePictureId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: EmployerGender, nullable: true })
  gender?: EmployerGender;

  @Column({ type: 'enum', enum: SkillCategory, nullable: true })
  industry?: SkillCategory;

  @Column({ nullable: true })
  contactPersonName?: string;

  @Column({ nullable: true })
  contactPersonJobTitle?: string;

  @Column({ nullable: true })
  workEmail?: string;

  @Column({ nullable: true })
  registeredBusinessAddress?: string;

  @Column({ default: false })
  declarationAccepted: boolean;

  @Column({ type: 'enum', enum: GovernmentIdType, nullable: true })
  governmentIdType?: GovernmentIdType;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  companyWebsite?: string;

  @Column({ nullable: true })
  companyDescription?: string;

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
  verificationStatus: VerificationStatus;

  @Column('uuid', { nullable: true })
  reviewedByAdminId?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  verificationRejectionReason?: string;

  @Column({ type: 'enum', enum: EmployerType, nullable: true })
  type?: EmployerType;

  @Column({
    type: 'enum',
    enum: EmployerStatus,
    default: EmployerStatus.INACTIVE,
  })
  status: EmployerStatus;

  @OneToOne(() => EmployerAuth, (auth) => auth.profile)
  @JoinColumn({ name: 'id' })
  auth: EmployerAuth;

  @OneToMany(
    () => EmployerVerificationDocument,
    (verificationDocument) => verificationDocument.employerProfile,
  )
  verificationDocuments: EmployerVerificationDocument[];

  @OneToMany(() => Job, (job) => job.employer)
  jobs: Job[];

  @OneToMany(() => Employee, (employee) => employee.employer)
  employees: Employee[];
}
