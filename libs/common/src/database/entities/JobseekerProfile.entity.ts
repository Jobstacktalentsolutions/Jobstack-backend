import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { JobseekerSkill } from './JobseekerSkill.entity';

export enum ApprovalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('job_seeker_profiles')
export class JobSeekerProfile {
  @PrimaryGeneratedColumn('uuid')
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

  @OneToOne('JobseekerAuth', 'profile', {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  auth: any;
}
