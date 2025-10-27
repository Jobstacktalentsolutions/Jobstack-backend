import { DataSource } from 'typeorm';
import { BaseFactory } from './base.factory';
import { Skill } from '@app/common/database/entities/Skill.entity';
import { getRepositoryByName } from '../utils/repository.utils';
import { SYSTEM_SKILLS } from '../data/skills.data';

/**
 * Skill factory for seeding skills
 */
export class SkillFactory extends BaseFactory<Skill> {
  constructor(dataSource: DataSource) {
    super(dataSource, getRepositoryByName(dataSource, 'Skill'), {
      defaultAttributes: () => ({}),
    });
  }

  /**
   * Smart upsert for skill by name (unique field)
   */
  async smartUpsertSkill(data: any): Promise<Skill> {
    const uniqueFields = ['name'];
    return await this.smartUpsert(data, uniqueFields);
  }

  /**
   * Create all skills from static data using smart upsert
   */
  async createAll(): Promise<Skill[]> {
    console.log('🔄 Upserting skill records...');

    const skills: Skill[] = [];
    for (const skillData of SYSTEM_SKILLS) {
      try {
        const skill = await this.smartUpsertSkill(skillData);
        skills.push(skill);
      } catch (error) {
        console.warn(
          `⚠️  Failed to upsert skill: ${skillData.name}`,
          error.message,
        );
      }
    }

    console.log(`✅ Upserted ${skills.length} skill records`);
    return skills;
  }
}
