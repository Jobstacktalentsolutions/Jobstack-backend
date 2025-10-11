import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { JobseekerSkill } from './JobseekerSkill.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';

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
