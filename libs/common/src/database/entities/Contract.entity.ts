import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './Employee.entity';
import { Document } from './Document.entity';
import { ContractStatus } from './schema.enum';

@Entity('contracts')
export class Contract extends BaseEntity {
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column('uuid')
  employeeId: string;

  @OneToOne(() => Document, { nullable: true })
  @JoinColumn({ name: 'contractDocumentId' })
  contractDocument?: Document;

  @Column('uuid', { nullable: true })
  contractDocumentId?: string;

  @Column({ nullable: true })
  templateVersion?: string;

  @Column({
    type: 'enum',
    enum: ContractStatus,
    default: ContractStatus.PENDING_SIGNATURES,
  })
  status: ContractStatus;

  // Employer signature details
  @Column({ type: 'timestamp', nullable: true })
  employerSignedAt?: Date;

  @Column({ nullable: true })
  employerSignatureIp?: string;

  @Column('uuid', { nullable: true })
  employerSignedById?: string;

  // Employee signature details
  @Column({ type: 'timestamp', nullable: true })
  employeeSignedAt?: Date;

  @Column({ nullable: true })
  employeeSignatureIp?: string;

  @Column('uuid', { nullable: true })
  employeeSignedById?: string;

  // Contract metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
