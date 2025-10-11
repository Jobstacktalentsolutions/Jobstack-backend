import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './Role.entity';
import { AdminAuth } from '@app/common/database/entities/AdminAuth.entity';

@Entity('admin_profiles')
export class AdminProfile extends BaseEntity {
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

  @OneToOne(() => AdminAuth, (auth) => auth.profile, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  auth: AdminAuth;

  @ManyToOne(() => Role, (role) => role.adminProfiles, { nullable: true })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @Column('uuid', { nullable: true })
  roleId?: string;
}
