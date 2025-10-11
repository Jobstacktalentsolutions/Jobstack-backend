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
import { JobseekerSession } from './JobseekerSession.entity';

@Entity('jobseeker_auth')
export class JobseekerAuth {
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

  @OneToMany(() => JobseekerSession, (session) => session.jobseeker)
  sessions: JobseekerSession[];

  @OneToOne('JobSeekerProfile', 'auth', { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  profile: any;

  @Column('uuid', { nullable: true })
  profileId?: string;
}
