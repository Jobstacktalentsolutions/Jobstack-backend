import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from '@app/common/database/entities/Skill.entity';
import { JobseekerSkill } from '@app/common/database/entities/JobseekerSkill.entity';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { AdminJwtGuard, JobSeekerJwtGuard } from 'apps/api/src/guards';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Skill, JobseekerSkill]),
    NotificationModule,
  ],
  controllers: [SkillsController],
  providers: [SkillsService, AdminJwtGuard, JobSeekerJwtGuard],
  exports: [SkillsService],
})
export class SkillsModule {}
