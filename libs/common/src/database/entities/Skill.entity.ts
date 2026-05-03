import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SkillStatus } from './schema.enum';

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
