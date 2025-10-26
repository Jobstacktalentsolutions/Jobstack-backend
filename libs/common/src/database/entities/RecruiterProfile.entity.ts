import { Entity, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RecruiterAuth } from './RecruiterAuth.entity';
import { RecruiterVerification } from './RecruiterVerification.entity';
import { Document } from './Document.entity';
import { RecruiterType } from './schema.enum';

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

  @ManyToOne(() => Document, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profilePictureId' })
  profilePicture?: Document;

  @Column('uuid', { nullable: true })
  profilePictureId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: RecruiterType })
  type: RecruiterType;

  @Column('uuid', { nullable: true })
  authId?: string;

  @OneToOne(() => RecruiterAuth, (auth) => auth.profile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'authId' })
  auth: RecruiterAuth;

  @OneToOne(() => RecruiterVerification, (v) => v.recruiter)
  verification?: RecruiterVerification;
}
