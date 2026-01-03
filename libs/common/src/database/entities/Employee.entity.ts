import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerProfile } from './EmployerProfile.entity';
import { Job } from './Job.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';
import {
  EmployeeStatus,
  EmploymentArrangement,
  EmploymentType,
  ContractPaymentType,
} from './schema.enum';

@Entity('employees')
export class Employee extends BaseEntity {
  @ManyToOne(() => EmployerProfile, (employer) => employer.employees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employerId' })
  employer: EmployerProfile;

  @Column('uuid')
  employerId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column('uuid')
  jobId: string;

  @ManyToOne(() => JobSeekerProfile, (profile) => profile.employments, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'jobseekerProfileId' })
  jobseekerProfile?: JobSeekerProfile;

  @Column('uuid', { nullable: true })
  jobseekerProfileId?: string;

  @Column({ type: 'enum', enum: EmploymentType })
  employmentType: EmploymentType;

  @Column({ type: 'enum', enum: EmploymentArrangement })
  employmentArrangement: EmploymentArrangement;

  @Column({
    type: 'enum',
    enum: EmployeeStatus,
    default: EmployeeStatus.ONBOARDING,
  })
  status: EmployeeStatus;

  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  // Salary for permanent employees
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryOffered?: number;

  // Contract compensation fields (for CONTRACT employment arrangement)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  contractFeeOffered?: number;

  @Column({ type: 'enum', enum: ContractPaymentType, nullable: true })
  contractPaymentType?: ContractPaymentType;

  @Column({ nullable: true })
  currency?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
