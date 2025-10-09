import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { UserProfileBase } from './base.entity';
import { AdminAuth } from './AdminAuth.entity';
import { Role } from './Role.entity';

@Entity('admin_profiles')
export class AdminProfile extends UserProfileBase {
  @OneToOne(() => AdminAuth, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  account: AdminAuth;

  @Column('uuid', { nullable: true })
  accountId?: string;

  @ManyToOne(() => Role, (role) => role.adminProfiles, { nullable: true })
  role?: Role;

  @Column('uuid', { nullable: true })
  roleId?: string;
}
