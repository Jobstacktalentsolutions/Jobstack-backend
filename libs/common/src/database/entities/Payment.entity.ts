import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './Employee.entity';
import { EmployerProfile } from './EmployerProfile.entity';
import { AdminAuth } from './AdminAuth.entity';
import { PaymentStatus, PaymentType } from './schema.enum';

@Entity('payments')
export class Payment extends BaseEntity {
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column('uuid')
  employeeId: string;

  @ManyToOne(() => EmployerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employerId' })
  employer: EmployerProfile;

  @Column('uuid')
  employerId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  paystackReference?: string;

  @Column({ nullable: true })
  paystackTransactionId?: string;

  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @ManyToOne(() => AdminAuth, { nullable: true })
  @JoinColumn({ name: 'processedByAdminId' })
  processedByAdmin?: AdminAuth;

  @Column('uuid', { nullable: true })
  processedByAdminId?: string;
}
