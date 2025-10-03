import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { RecruiterAuth } from './RecruiterAuth.entity';
import { UserSession } from './base.entity';

@Entity('recruiter_sessions')
export class RecruiterSession extends UserSession {
  @Column('uuid')
  recruiterId: string;

  @ManyToOne(() => RecruiterAuth, (recruiter) => recruiter.sessions)
  @JoinColumn({ name: 'recruiterId' })
  recruiter: RecruiterAuth;

  @Column('varchar', { length: 255, nullable: true })
  deviceToken?: string;

  isValid(): boolean {
    return !this.isExpired() && this.isActive;
  }
}
