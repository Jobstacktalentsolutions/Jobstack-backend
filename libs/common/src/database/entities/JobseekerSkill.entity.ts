import { Entity, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { JobSeekerProfile } from './JobseekerProfile.entity';
import { Skill } from './Skill.entity';

export enum Proficiency {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

@Entity('jobseeker_skills')
@Unique(['profileId', 'skillId'])
export class JobseekerSkill extends BaseEntity {
  @Column('uuid')
  profileId: string;

  @ManyToOne(() => JobSeekerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profileId' })
  profile: JobSeekerProfile;

  @Column('uuid')
  skillId: string;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'skillId' })
  skill: Skill;

  @Column({
    type: 'enum',
    enum: Proficiency,
    default: Proficiency.INTERMEDIATE,
  })
  proficiency: Proficiency;

  @Column({ type: 'int', default: 0 })
  yearsExperience: number;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;
}
