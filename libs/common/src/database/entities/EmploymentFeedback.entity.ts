import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Employee } from './Employee.entity';
import { EmploymentFeedbackReviewerRole } from './schema.enum';

@Entity('employment_feedback')
@Unique(['employeeId', 'reviewerRole'])
@Index(['employeeId'])
export class EmploymentFeedback extends BaseEntity {
  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column('uuid')
  employeeId: string;

  @Column({ type: 'enum', enum: EmploymentFeedbackReviewerRole })
  reviewerRole: EmploymentFeedbackReviewerRole;

  /** Overall rating 1–5. */
  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;
}
