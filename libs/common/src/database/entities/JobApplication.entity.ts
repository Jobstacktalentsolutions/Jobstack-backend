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

  @Column({ type: 'int', nullable: true })
  screeningDurationMinutes?: number | null; // Duration of screening in minutes

  // Whether the employer has paid to unlock this candidate's PII (email/phone).
  // Set to true by the payment webhook before the employer makes a hire/screen decision.
  @Column({ type: 'boolean', default: false })
  piiUnlocked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  piiUnlockedAt?: Date | null;

  // Overall vetting score for this application (0-100)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  vettingScore?: number | null;

  // Profile completeness score used during vetting (0-100)
  @Column({ type: 'int', nullable: true })
  vettingProfileCompleteness?: number | null;

  // Proximity score used during vetting (0-100)
  @Column({ type: 'int', nullable: true })
  vettingProximityScore?: number | null;

  // Experience score used during vetting (0-100)
  @Column({ type: 'int', nullable: true })
  vettingExperienceScore?: number | null;

  // Skill match score used during vetting (0-100)
  @Column({ type: 'int', nullable: true })
  vettingSkillMatchScore?: number | null;

  // Application speed score used during vetting (0-100)
  @Column({ type: 'int', nullable: true })
  vettingApplicationSpeedScore?: number | null;

  // Whether this application is currently highlighted after vetting
  @Column({ type: 'boolean', nullable: true })
  vettingIsHighlighted?: boolean | null;

  // Timestamp when this application was last vetted
  @Column({ type: 'timestamp', nullable: true })
  vettedAt?: Date | null;

  // Screening notes captured by the employer when they complete the screening
  @Column({ type: 'text', nullable: true })
  screeningStrengths?: string | null;

  @Column({ type: 'text', nullable: true })
  screeningConcerns?: string | null;

  @Column({ type: 'text', nullable: true })
  screeningInterviewFeedback?: string | null;
}
