import { Entity, OneToMany, OneToOne, JoinColumn, Column } from 'typeorm';
import { AuthBase } from './base.entity';
import { JobseekerSession } from './JobseekerSession.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';

@Entity('jobseeker_auth')
export class JobseekerAuth extends AuthBase {
  @OneToMany(() => JobseekerSession, (session) => session.jobseeker)
  sessions: JobseekerSession[];

  @OneToOne(() => JobSeekerProfile, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  profile: JobSeekerProfile;

  @Column('uuid', { nullable: true })
  profileId?: string;
}
