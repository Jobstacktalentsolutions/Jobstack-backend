import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobseekerAuth } from './JobseekerAuth.entity';
import { RecruiterAuth } from './RecruiterAuth.entity';
import { AdminAuth } from './AdminAuth.entity';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  READ = 'read',
}

export enum NotificationType {
  EMAIL = 'email',
  APP = 'app',
}

export enum NotificationPriority {
  LOW = 4,
  MEDIUM = 3,
  HIGH = 2,
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.LOW,
  })
  priority: NotificationPriority;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  recipient?: string; // Email address for email notifications

  @Column({ nullable: true })
  templateType?: string;

  @Column('jsonb', { nullable: true })
  templateContext?: Record<string, any>;

  @Column({ nullable: true })
  jobseekerId?: string;

  @Column({ nullable: true })
  recruiterId?: string;

  @Column({ nullable: true })
  adminId?: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column('text', { nullable: true })
  errorMessage?: string;

  @Column({ default: 0 })
  retryCount: number;

  // Relations
  @ManyToOne(() => JobseekerAuth, { nullable: true })
  @JoinColumn({ name: 'jobseekerId' })
  jobseeker?: JobseekerAuth;

  @ManyToOne(() => RecruiterAuth, { nullable: true })
  @JoinColumn({ name: 'recruiterId' })
  recruiter?: RecruiterAuth;

  @ManyToOne(() => AdminAuth, { nullable: true })
  @JoinColumn({ name: 'adminId' })
  admin?: AdminAuth;

  // Helper methods
  isRead(): boolean {
    return this.status === NotificationStatus.READ;
  }

  markAsRead(): void {
    this.status = NotificationStatus.READ;
    this.readAt = new Date();
  }

  markAsSent(): void {
    this.status = NotificationStatus.SENT;
    this.sentAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = NotificationStatus.FAILED;
    this.errorMessage = errorMessage;
    this.retryCount += 1;
  }

  canRetry(): boolean {
    return this.status === NotificationStatus.FAILED && this.retryCount < 3;
  }
}
