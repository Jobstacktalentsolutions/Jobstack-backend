import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { UserRole } from '@app/common/shared/enums/user-roles.enum';

export abstract class BaseEntity {
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
}

export abstract class AuthBase extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
}

export abstract class UserProfileBase extends BaseEntity {
  @Column({
    type: 'enum',
    enum: UserRole,
    nullable: false,
  })
  role: UserRole;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  profilePictureUrl?: string;

  @Column({ nullable: true })
  address?: string;
}

export abstract class UserSession extends BaseEntity {
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

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  abstract isValid(): boolean;

  getRemainingTime(): number {
    return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
  }
}
