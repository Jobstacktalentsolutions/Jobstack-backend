import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecruiterAuth } from './RecruiterAuth.entity';
import { RecruiterVerification } from './RecruiterVerification.entity';
import { Document } from './Document.entity';
import { RecruiterType } from './schema.enum';

@Entity('recruiter_profiles')
export class RecruiterProfile {
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

  @ManyToOne(() => Document, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profilePictureId' })
  profilePicture?: Document;

  @Column('uuid', { nullable: true })
  profilePictureId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: RecruiterType, nullable: true })
  type?: RecruiterType;

  @OneToOne(() => RecruiterAuth, (auth) => auth.profile)
  @JoinColumn({ name: 'id' })
  auth: RecruiterAuth;

  @OneToOne(() => RecruiterVerification, (v) => v.recruiter)
  verification?: RecruiterVerification;
}
