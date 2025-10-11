import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

export enum RecruiterType {
  INDIVIDUAL = 'Individual',
  ORGANIZATION = 'Organization',
}
@Entity('recruiter')
export class RecruiterProfile {
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

  @Column({ type: 'enum', enum: RecruiterType })
  type: RecruiterType;

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  contactName?: string;

  @Column({ nullable: true })
  website?: string;

  @OneToOne('RecruiterAuth', 'profile', {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  auth: any;
}
