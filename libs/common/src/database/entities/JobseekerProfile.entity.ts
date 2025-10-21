import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobseekerSkill } from './JobseekerSkill.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';
import { Document } from './Document.entity';

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('job_seeker_profiles')
export class JobSeekerProfile extends BaseEntity {
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

  @Column({ type: 'text' })
  brief: string;

  @Column({ type: 'text', nullable: true })
  preferredLocation?: string;

  @Column('uuid', { nullable: true })
  cvDocumentId?: string;

  @OneToOne(() => Document, { nullable: true })
  @JoinColumn({ name: 'cvDocumentId' })
  cvDocument?: Document;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalStatus: ApprovalStatus;

  @Column('uuid', { nullable: true })
  authId?: string;

  @OneToOne(() => JobseekerAuth, (auth) => auth.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authId' })
  auth: JobseekerAuth;
}
