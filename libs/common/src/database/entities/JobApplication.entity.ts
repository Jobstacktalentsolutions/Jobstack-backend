import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Job } from './Job.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';
import { JobApplicationStatus } from './schema.enum';

@Entity('job_applications')
export class JobApplication extends BaseEntity {
  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column('uuid')
  jobId: string;

  @ManyToOne(() => JobSeekerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobseekerProfileId' })
  jobseekerProfile: JobSeekerProfile;

  @Column('uuid')
  jobseekerProfileId: string;

  @Column({
    type: 'enum',
    enum: JobApplicationStatus,
    default: JobApplicationStatus.APPLIED,
  })
  status: JobApplicationStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  expectedSalary?: number;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'timestamp', nullable: true })
  statusUpdatedAt?: Date;

  // Screening meeting details (set when candidate is selected for screening)
  @Column({ type: 'text', nullable: true })
  screeningMeetingLink?: string;

  @Column({ type: 'timestamp', nullable: true })
  screeningScheduledAt?: Date;

  @Column({ type: 'text', nullable: true })
  screeningPrepInfo?: string; // Additional information for candidate preparation
}
