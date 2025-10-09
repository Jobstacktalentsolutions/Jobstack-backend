import { Column, Entity, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { AuthBase } from './base.entity';
import { AdminSession } from './AdminSession.entity';
import { AdminProfile } from './AdminProfile.entity';

@Entity('admin_auth')
export class AdminAuth extends AuthBase {
  @OneToMany(() => AdminSession, (session) => session.admin)
  sessions: AdminSession[];

  @OneToOne(() => AdminProfile, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  profile?: AdminProfile;

  @Column('uuid', { nullable: true })
  profileId?: string;
}
