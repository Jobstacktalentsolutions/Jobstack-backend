import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { JobseekerAuth } from './JobseekerAuth.entity';
import { UserSession } from './base.entity';

@Entity('jobseeker_sessions')
export class JobseekerSession extends UserSession {
  @Column('uuid')
  jobseekerId: string;

  @ManyToOne(() => JobseekerAuth, (jobseeker) => jobseeker.sessions)
  @JoinColumn({ name: 'jobseekerId' })
  jobseeker: JobseekerAuth;

  @Column('varchar', { length: 255, nullable: true })
  deviceToken?: string;

  isValid(): boolean {
    return !this.isExpired() && this.isActive;
  }
}
