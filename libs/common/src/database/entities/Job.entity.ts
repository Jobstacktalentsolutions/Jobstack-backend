import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { EmployerProfile } from './EmployerProfile.entity';
import { Skill } from './Skill.entity';
import { JobApplication } from './JobApplication.entity';
import {
  DayOfWeek,
  EmploymentArrangement,
  EmploymentType,
  SkillCategory,
  JobStatus,
  WorkMode,
} from './schema.enum';

@Entity('jobs')
export class Job extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: SkillCategory })
  category: SkillCategory;

  @Column({ type: 'enum', enum: EmploymentType })
  employmentType: EmploymentType;

  @Column({ type: 'enum', enum: EmploymentArrangement })
  employmentArrangement: EmploymentArrangement;

  @Column({ type: 'enum', enum: WorkMode })
  workMode: WorkMode;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMin?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salaryMax?: number;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'jsonb', nullable: true })
  workDays?: DayOfWeek[];

  @Column({ nullable: true })
  startTime?: string;

  @Column({ nullable: true })
  endTime?: string;

  @Column({ type: 'jsonb', default: [] })
  tags: string[];

  @Column({ type: 'timestamp', nullable: true })
  applicationDeadline?: Date;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.DRAFT,
  })
  status: JobStatus;

  @Column({ type: 'int', default: 0 })
  applicantsCount: number;

  @ManyToMany(() => Skill, { cascade: false })
  @JoinTable({
    name: 'job_skills',
    joinColumn: { name: 'jobId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skillId', referencedColumnName: 'id' },
  })
  skills: Skill[];

  @ManyToOne(() => EmployerProfile, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employerId' })
  employer: EmployerProfile;

  @Column('uuid')
  employerId: string;

  @OneToMany(() => JobApplication, (application) => application.job)
  applications: JobApplication[];
}
