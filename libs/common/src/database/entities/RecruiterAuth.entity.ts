import {
  Entity,
  OneToMany,
  OneToOne,
  JoinColumn,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RecruiterSession } from './RecruiterSession.entity';

@Entity('recruiter_auth')
export class RecruiterAuth {
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

  @OneToMany(() => RecruiterSession, (session) => session.recruiter)
  sessions: RecruiterSession[];

  @OneToOne('RecruiterProfile', 'auth', { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  profile: any;

  @Column('uuid', { nullable: true })
  profileId?: string;
}
