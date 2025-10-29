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
import { ApprovalStatus } from './schema.enum';

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

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ nullable: true })
  address?: string;

  @OneToMany(() => JobseekerSkill, (js) => js.profile, { cascade: true })
  userSkills: JobseekerSkill[];

  @Column({ type: 'text', nullable: true })
  jobTitle?: string;

  @Column({ type: 'text', nullable: true })
  brief?: string;

  @Column({ type: 'text', nullable: true })
  preferredLocation?: string;

  @Column('uuid', { nullable: true })
  cvDocumentId?: string;

  @OneToOne(() => Document, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cvDocumentId' })
  cvDocument?: Document;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalStatus: ApprovalStatus;

  @OneToOne(() => JobseekerAuth, (auth) => auth.profile)
  @JoinColumn({ name: 'id' })
  auth: JobseekerAuth;
}
