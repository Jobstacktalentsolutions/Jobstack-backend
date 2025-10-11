import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';
import { RecruiterAuth } from './RecruiterAuth.entity';

export enum RecruiterType {
  INDIVIDUAL = 'Individual',
  ORGANIZATION = 'Organization',
}
@Entity('recruiter')
export class RecruiterProfile extends BaseEntity {

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

  @Column({ type: 'enum', enum: RecruiterType })
  type: RecruiterType;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  contactName?: string;

  @Column({ nullable: true })
  website?: string;

  @OneToOne(() => RecruiterAuth, (auth) => auth.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  auth: RecruiterAuth;
}
