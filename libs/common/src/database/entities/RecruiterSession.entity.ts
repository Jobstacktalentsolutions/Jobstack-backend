import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecruiterAuth } from './RecruiterAuth.entity';

@Entity('recruiter_sessions')
export class RecruiterSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

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
  recruiterId: string;

  @ManyToOne(() => RecruiterAuth, (recruiter) => recruiter.sessions)
  @JoinColumn({ name: 'recruiterId' })
  recruiter: RecruiterAuth;

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
