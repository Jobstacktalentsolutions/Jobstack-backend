import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserProfileBase } from '@app/common/database/entities/UserProfileBase.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('job_seeker_profiles')
export class JobSeekerProfile extends UserProfileBase {
  @Column({ type: 'text', array: true, default: [] })
  skills: string[];

  @Column({ type: 'text' })
  brief: string;

  @Column({ nullable: true })
  cvUrl?: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalStatus: ApprovalStatus;

  @OneToOne(() => JobseekerAuth, (auth) => auth.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  auth: JobseekerAuth;
}
