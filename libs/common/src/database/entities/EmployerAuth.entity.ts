import { Entity, OneToMany, OneToOne, JoinColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerSession } from './EmployerSession.entity';
import { EmployerProfile } from './EmployerProfile.entity';

@Entity('employer_auth')
export class EmployerAuth extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @OneToMany(() => EmployerSession, (session) => session.employer)
  sessions: EmployerSession[];

  @OneToOne(() => EmployerProfile, (profile) => profile.auth, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  profile: EmployerProfile;
}
