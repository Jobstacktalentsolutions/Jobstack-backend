import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { JobseekerSkill } from './JobseekerSkill.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';
import { Document } from './Document.entity';
import {
  ApprovalStatus,
  EmploymentArrangement,
  EmploymentType,
  SkillCategory,
  WorkMode,
} from './schema.enum';
import { JobApplication } from './JobApplication.entity';
import { Employee } from './Employee.entity';
import { JobseekerVerificationDocument } from './JobseekerVerificationDocument.entity';

@Entity('jobseeker_profiles')
export class JobSeekerProfile {
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

  @Column('varchar')
  firstName: string;

  @Column('varchar')
  lastName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 160, nullable: true })
  /**
   * Public URL slug (jobstack.org/public/jobseekers/[slug]).
   * Generated from `${firstName}_${lastName}` and de-duplicated with random suffix.
   */
  slug?: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  phoneNumber: string;

  @Column('uuid', { nullable: true })
  profilePictureId?: string;

  @OneToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profilePictureId' })
  profilePicture?: Document;

  @Column({ type: 'varchar', nullable: true })
  address?: string;

  @OneToMany(() => JobseekerSkill, (js) => js.profile, { cascade: true })
  userSkills: JobseekerSkill[];

  @Column({ type: 'text', nullable: true })
  jobTitle?: string;

  @Column({ type: 'varchar', length: 3000, nullable: true })
  brief?: string;

  @Column({ type: 'int', nullable: true })
  yearsOfExperience?: number;

  @Column({ type: 'text', nullable: true })
  preferredLocation?: string;

  @Column({ type: 'varchar', nullable: true })
  state?: string;

  @Column({ type: 'varchar', nullable: true })
  city?: string;

  @Column('uuid', { nullable: true })
  cvDocumentId?: string;

  @OneToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cvDocumentId' })
  cvDocument?: Document;

  @OneToMany(() => JobseekerVerificationDocument, (v) => v.jobseekerProfile, {
    cascade: true,
  })
  verificationDocuments: JobseekerVerificationDocument[];

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.NOT_STARTED,
  })
  approvalStatus: ApprovalStatus;

  @Column({ type: 'varchar', nullable: true })
  approvalRejectionReason?: string;

  @Column('uuid', { nullable: true })
  approvalReviewedByAdminId?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvalReviewedAt?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  minExpectedSalary?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  maxExpectedSalary?: number;

  @Column({
    type: 'enum',
    enum: EmploymentType,
    nullable: true,
  })
  preferredEmploymentType?: EmploymentType;

  @Column({
    type: 'enum',
    enum: WorkMode,
    nullable: true,
  })
  preferredWorkMode?: WorkMode;

  @Column({
    type: 'enum',
    enum: EmploymentArrangement,
    nullable: true,
  })
  preferredEmploymentArrangement?: EmploymentArrangement;

  @Column({
    type: 'enum',
    enum: SkillCategory,
    nullable: true,
  })
  workSector?: SkillCategory;

  @Column({ type: 'jsonb', nullable: true })
  /**
   * Work experience entries stored as JSON array.
   * Each entry: { company: string, role: string, duration: string, description: string }
   */
  workExperience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  /**
   * Exactly two onboarding reference contacts.
   * Each entry: { name, phoneNumber, homeAddress, relationship }
   */
  referenceContacts?: Array<{
    name: string;
    phoneNumber: string;
    homeAddress: string;
    relationship: string;
  }>;

  @OneToOne(() => JobseekerAuth, (auth) => auth.profile)
  @JoinColumn({ name: 'id' })
  auth: JobseekerAuth;

  @OneToMany(
    () => JobApplication,
    (application) => application.jobseekerProfile,
  )
  applications: JobApplication[];

  @OneToMany(() => Employee, (employee) => employee.jobseekerProfile)
  employments: Employee[];
}
