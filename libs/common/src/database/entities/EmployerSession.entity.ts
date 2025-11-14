import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerAuth } from './EmployerAuth.entity';

@Entity('employer_sessions')
export class EmployerSession extends BaseEntity {
  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  deviceInfo?: Record<string, any>;

  @Column('inet', { nullable: true })
  ipAddress?: string;

  @Column('jsonb', { nullable: true })
  lastActivity?: Record<string, any>;

  @Column('timestamp', { nullable: true })
  lastActivityAt?: Date;

  @Column('timestamp')
  expiresAt: Date;

  @Column('uuid')
  employerId: string;

  @ManyToOne(() => EmployerAuth, (employer) => employer.sessions)
  @JoinColumn({ name: 'employerId' })
  employer: EmployerAuth;

  @Column('varchar', { length: 255, nullable: true })
  deviceToken?: string;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isExpired() && this.isActive;
  }

  getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }
}
