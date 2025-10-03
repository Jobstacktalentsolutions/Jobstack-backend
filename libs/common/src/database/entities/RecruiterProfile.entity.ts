import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserProfileBase } from './UserProfileBase.entity';
import { RecruiterAuth } from './RecruiterAuth.entity';

export enum RecruiterType {
  INDIVIDUAL = 'Individual',
  ORGANIZATION = 'Organization',
}
@Entity('recruiter')
export class RecruiterProfile extends UserProfileBase {
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
