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

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  suspended: boolean;

  @Column({ type: 'timestamp', nullable: true })
  suspendedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  suspensionReason: string | null;

  @OneToMany(() => JobseekerSession, (session) => session.jobseeker)
  sessions: JobseekerSession[];

  @OneToOne(() => JobSeekerProfile, (profile) => profile.auth, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: JobSeekerProfile;
}
