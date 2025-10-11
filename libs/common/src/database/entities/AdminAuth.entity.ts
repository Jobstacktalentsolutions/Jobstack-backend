import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminSession } from './AdminSession.entity';

@Entity('admin_auth')
export class AdminAuth {
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

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @OneToMany(() => AdminSession, (session) => session.admin)
  sessions: AdminSession[];

  @OneToOne('AdminProfile', 'account', { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  profile?: any;

  @Column('uuid', { nullable: true })
  profileId?: string;
}
