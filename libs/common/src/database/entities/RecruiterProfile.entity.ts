import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserProfileBase } from './base.entity';
import { RecruiterAuth } from './RecruiterAuth.entity';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

export enum RecruiterType {
  INDIVIDUAL = 'Individual',
  ORGANIZATION = 'Organization',
}
@Entity('recruiter')
export class RecruiterProfile extends UserProfileBase {
  constructor() {
    super();
    this.role = UserRole.RECRUITER;
  }
  @Column({ type: 'enum', enum: RecruiterType })
  type: RecruiterType;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  contactName?: string;

  @Column({ nullable: true })
  website?: string;

  @OneToOne(() => RecruiterAuth, (auth) => auth.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  auth: RecruiterAuth;
}
