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

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => AdminProfile, (profile) => profile.role)
  adminProfiles: AdminProfile[];
}
