import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Job } from './Job.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';

@Entity('job_bookmarks')
@Unique(['jobseekerProfileId', 'jobId'])
@Index(['jobseekerProfileId'])
export class JobBookmark extends BaseEntity {
  @ManyToOne(() => JobSeekerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobseekerProfileId' })
  jobseekerProfile: JobSeekerProfile;

  @Column('uuid')
  jobseekerProfileId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @Column('uuid')
  jobId: string;
}
