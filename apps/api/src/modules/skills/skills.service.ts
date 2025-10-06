import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Skill, SkillStatus } from '@app/common/database/entities/Skill.entity';
import {
  JobseekerSkill,
  Proficiency,
} from '@app/common/database/entities/JobseekerSkill.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '../../notification/notification.service';
import {
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '../../notification/notification.enum';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill) private skillRepo: Repository<Skill>,
    @InjectRepository(JobseekerSkill)
    private jsSkillRepo: Repository<JobseekerSkill>,
    private notificationService: NotificationService,
  ) {}

  // Admin: create skill
  async createSkill(input: {
    name: string;
    description?: string;
    synonyms?: string[];
    status?: SkillStatus;
  }): Promise<Skill> {
    const exists = await this.skillRepo.findOne({
      where: { name: ILike(input.name) },
    });
    if (exists) throw new BadRequestException('Skill already exists');
    const skill = this.skillRepo.create({
      name: input.name.trim(),
      description: input.description,
      synonyms: input.synonyms ?? [],
      status: input.status ?? SkillStatus.ACTIVE,
    });
    return await this.skillRepo.save(skill);
  }

  // Admin: update skill (partial)
  async updateSkill(
    id: string,
    input: Partial<Pick<Skill, 'name' | 'description' | 'synonyms' | 'status'>>,
  ): Promise<Skill> {
    const skill = await this.skillRepo.findOne({ where: { id } });
    if (!skill) throw new NotFoundException('Skill not found');
    Object.assign(skill, input);
    return await this.skillRepo.save(skill);
  }

  // Admin: delete skill
  async deleteSkill(id: string): Promise<void> {
    const skill = await this.skillRepo.findOne({ where: { id } });
    if (!skill) return; // idempotent
    await this.skillRepo.remove(skill);
  }

  // Public: search active skills
  async searchSkills(query?: string): Promise<Skill[]> {
    if (!query)
      return this.skillRepo.find({ where: { status: SkillStatus.ACTIVE } });
    const q = query.trim();
    return this.skillRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SkillStatus.ACTIVE })
      .andWhere(
        '(LOWER(s.name) LIKE LOWER(:q) OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(s.synonyms) syn WHERE LOWER(syn) LIKE LOWER(:q)))',
        {
          q: `%${q}%`,
        },
      )
      .orderBy('s.name', 'ASC')
      .getMany();
  }

  // Public: suggest skill creates a SUGGESTED skill and returns it
  async suggestSkill(name: string): Promise<Skill> {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Name required');
    const existing = await this.skillRepo.findOne({
      where: [{ name: ILike(trimmed) }],
    });
    if (existing) return existing;
    const skill = this.skillRepo.create({
      name: trimmed,
      status: SkillStatus.SUGGESTED,
      synonyms: [],
    });
    const saved = await this.skillRepo.save(skill);
    // Notify admins via app notification record (no email here)
    await this.notificationService['notificationRepository'].save({
      title: 'New skill suggested',
      message: `A new skill was suggested: ${saved.name}`,
      type: NotificationType.APP,
      status: NotificationStatus.PENDING,
      priority: NotificationPriority.MEDIUM,
      metadata: { skillId: saved.id, name: saved.name },
    });
    return saved;
  }

  // Attach skills to a profile with metadata
  async attachSkillsToProfile(
    profileId: string,
    items: Array<{
      skillId: string;
      proficiency?: Proficiency;
      yearsExperience?: number;
    }>,
  ): Promise<void> {
    if (!items?.length) return;
    const rows = items.map((i) =>
      this.jsSkillRepo.create({
        profileId,
        skillId: i.skillId,
        proficiency: i.proficiency ?? Proficiency.INTERMEDIATE,
        yearsExperience: i.yearsExperience ?? 0,
      }),
    );
    await this.jsSkillRepo.save(rows);
  }
}
