import {
  Column,
  Entity,
  ManyToMany,
  JoinTable,
  Unique,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Permission } from './Permission.entity';
import { AdminProfile } from './AdminProfile.entity';

@Entity('roles')
@Unique(['name'])
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'role_permissions',
  })
  permissions: Permission[];

  @OneToMany(() => AdminProfile, (profile) => profile.role)
  adminProfiles: AdminProfile[];
}
