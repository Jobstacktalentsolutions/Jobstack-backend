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

  @Column({ default: false })
  emailVerified: boolean;

  // New simplified authorization fields
  @Column({ type: 'varchar', length: 64 })
  roleKey: string; // keyof typeof AdminRole (stored as string)

  @Column({ type: 'int' })
  privilegeLevel: number;

  // Manager relationship (admin who created this admin)
  @Column('uuid', { nullable: true })
  managerId?: string;

  @OneToMany(() => AdminSession, (session) => session.admin)
  sessions: AdminSession[];

@OneToOne(() => AdminProfile, (profile) => profile.auth, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile?: AdminProfile;
}
