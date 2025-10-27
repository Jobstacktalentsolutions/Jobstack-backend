import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AdminAuth } from './AdminAuth.entity';

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

  @Column('uuid', { nullable: true })
  authId?: string;

  @OneToOne(() => AdminAuth, (auth) => auth.profile)
  @JoinColumn({ name: 'authId' })
  auth: AdminAuth;
}
