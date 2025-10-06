import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserProfileBase } from './base.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { JobseekerSkill } from './JobseekerSkill.entity';

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('job_seeker_profiles')
export class JobSeekerProfile extends UserProfileBase {
  constructor() {
    super();
    this.role = UserRole.JOB_SEEKER;
  }
  @OneToMany(() => JobseekerSkill, (js) => js.profile, { cascade: true })
  userSkills: JobseekerSkill[];

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

  @OneToOne(() => JobseekerAuth, (auth) => auth.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  auth: JobseekerAuth;
}
