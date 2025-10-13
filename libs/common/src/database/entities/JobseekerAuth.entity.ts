import { Entity, OneToMany, OneToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobseekerSession } from './JobseekerSession.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';

@Entity('jobseeker_auth')
export class JobseekerAuth extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => JobseekerSession, (session) => session.jobseeker)
  sessions: JobseekerSession[];

  @OneToOne(() => JobSeekerProfile, (profile) => profile.auth)
  profile: JobSeekerProfile;
}
