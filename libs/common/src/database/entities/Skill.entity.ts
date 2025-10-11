import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum SkillStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  SUGGESTED = 'SUGGESTED',
}

@Entity('skills')
export class Skill extends BaseEntity {
  @Index({ unique: true })
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: [] })
  synonyms: string[];

  @Column({ type: 'enum', enum: SkillStatus, default: SkillStatus.ACTIVE })
  status: SkillStatus;
}
