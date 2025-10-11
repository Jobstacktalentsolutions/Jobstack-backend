import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './Role.entity';

@Entity('admin_profiles')
export class AdminProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

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

  @OneToOne('AdminAuth', 'profile')
  @JoinColumn()
  account: any;

  @Column('uuid', { nullable: true })
  accountId?: string;

  @ManyToOne(() => Role, (role) => role.adminProfiles, { nullable: true })
  role?: Role;

  @Column('uuid', { nullable: true })
  roleId?: string;
}
