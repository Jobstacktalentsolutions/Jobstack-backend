import { Entity, OneToMany, OneToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RecruiterSession } from './RecruiterSession.entity';
import { RecruiterProfile } from './RecruiterProfile.entity';

@Entity('recruiter_auth')
export class RecruiterAuth extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @OneToMany(() => RecruiterSession, (session) => session.recruiter)
  sessions: RecruiterSession[];

  @OneToOne(() => RecruiterProfile, (profile) => profile.auth)
  profile: RecruiterProfile;
}
