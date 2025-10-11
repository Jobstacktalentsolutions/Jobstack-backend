import { Column, Entity, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AdminSession } from './AdminSession.entity';
import { AdminProfile } from './AdminProfile.entity';

@Entity('admin_auth')
export class AdminAuth extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => AdminSession, (session) => session.admin)
  sessions: AdminSession[];

  @OneToOne(() => AdminProfile, (profile) => profile.auth, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  profile?: AdminProfile;
}
