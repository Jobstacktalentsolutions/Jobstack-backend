import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerProfile } from './EmployerProfile.entity';
import { Job } from './Job.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';
import {
  EmployeeStatus,
  EmploymentArrangement,
  EmploymentType,
  ContractPaymentType,
  EmployeePaymentStatus,
} from './schema.enum';
import { Payment } from '@app/common/database/entities/Payment.entity';

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

  // Payment related fields
  @Column({
    type: 'enum',
    enum: EmployeePaymentStatus,
    default: EmployeePaymentStatus.NOT_REQUIRED,
  })
  paymentStatus: EmployeePaymentStatus;

  @Column({ type: 'boolean', default: false })
  activationBlocked: boolean;

  // Employee Activation Payment fields
  @Column({ type: 'boolean', default: false })
  piiUnlocked: boolean; // Gates candidate PII until activation payment is completed

  @Column('uuid', { nullable: true })
  activationPaymentId?: string;

  // Payment relation
  @OneToOne('Payment', { nullable: true })
  @JoinColumn({ name: 'activationPaymentId' })
  activationPayment?: Payment;
}
