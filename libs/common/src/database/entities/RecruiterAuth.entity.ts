import { Entity, OneToMany, OneToOne, JoinColumn, Column } from 'typeorm';
import { AuthBase } from './AuthBase.entity';
import { RecruiterSession } from './RecruiterSession.entity';
import { RecruiterProfile } from './RecruiterProfile.entity';

@Entity('recruiter_auth')
export class RecruiterAuth extends AuthBase {
  @OneToMany(() => RecruiterSession, (session) => session.recruiter)
  sessions: RecruiterSession[];

  @OneToOne(() => RecruiterProfile, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  profile: RecruiterProfile;

  @Column('uuid', { nullable: true })
  profileId?: string;
}
