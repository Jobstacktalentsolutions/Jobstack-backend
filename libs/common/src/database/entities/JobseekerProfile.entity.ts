import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobseekerSkill } from './JobseekerSkill.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';
import { Document } from './Document.entity';
import {
  ApprovalStatus,
  EmploymentArrangement,
  EmploymentType,
  WorkMode,
} from './schema.enum';
import { JobApplication } from './JobApplication.entity';
import { Employee } from './Employee.entity';

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

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column('uuid', { nullable: true })
  profilePictureId?: string;

  @OneToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'profilePictureId' })
  profilePicture?: Document;

  @Column({ nullable: true })
  address?: string;

  @OneToMany(() => JobseekerSkill, (js) => js.profile, { cascade: true })
  userSkills: JobseekerSkill[];

  @Column({ type: 'text', nullable: true })
  jobTitle?: string;

  @Column({ type: 'text', nullable: true })
  brief?: string;

  @Column({ type: 'int', nullable: true })
  yearsOfExperience?: number;

  @Column({ type: 'text', nullable: true })
  preferredLocation?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column('uuid', { nullable: true })
  cvDocumentId?: string;

  @OneToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cvDocumentId' })
  cvDocument?: Document;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.NOT_STARTED,
  })
  approvalStatus: ApprovalStatus;

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
