import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EmployerAuth } from './EmployerAuth.entity';
import { EmployerVerification } from './EmployerVerification.entity';
import { Document } from './Document.entity';
import { EmployerType, EmployerStatus } from './schema.enum';
import { Job } from './Job.entity';
import { Employee } from './Employee.entity';

@Entity('employer_profiles')
export class EmployerProfile {
  @PrimaryColumn('uuid')
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

  @ManyToOne(() => Document, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'profilePictureId' })
  profilePicture?: Document;

  @Column('uuid', { nullable: true })
  profilePictureId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: EmployerType, nullable: true })
  type?: EmployerType;

  @Column({
    type: 'enum',
    enum: EmployerStatus,
    default: EmployerStatus.INACTIVE,
  })
  status: EmployerStatus;

  @OneToOne(() => EmployerAuth, (auth) => auth.profile)
  @JoinColumn({ name: 'id' })
  auth: EmployerAuth;

  @OneToOne(() => EmployerVerification, (v) => v.employer)
  verification?: EmployerVerification;

  @OneToMany(() => Job, (job) => job.employer)
  jobs: Job[];

  @OneToMany(() => Employee, (employee) => employee.employer)
  employees: Employee[];
}
