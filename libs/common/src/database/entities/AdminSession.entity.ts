import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AdminAuth } from './AdminAuth.entity';
import { UserSession } from './base.entity';

@Entity('admin_sessions')
export class AdminSession extends UserSession {
  @Column('uuid')
  adminId: string;

  @ManyToOne(() => AdminAuth, (admin) => admin.sessions)
  @JoinColumn({ name: 'adminId' })
  admin: AdminAuth;

  isValid(): boolean {
    return !this.isExpired() && this.isActive;
  }
}
