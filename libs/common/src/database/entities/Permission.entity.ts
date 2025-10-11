import {
  Column,
  Entity,
  ManyToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './Role.entity';
import type { PermissionKey } from '@app/common/shared/enums/permissions.enum';

@Entity('permissions')
@Unique(['key'])
export class Permission extends BaseEntity {

  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'varchar', length: 128 })
  key: PermissionKey;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
