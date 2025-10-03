import { Entity, OneToMany } from 'typeorm';
import { AuthBase } from './AuthBase.entity';
import { AdminSession } from './AdminSession.entity';

@Entity('admin_auth')
export class AdminAuth extends AuthBase {
  @OneToMany(() => AdminSession, (session) => session.admin)
  sessions: AdminSession[];
}
