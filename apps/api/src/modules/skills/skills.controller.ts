import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { AdminJwtGuard, JobSeekerJwtGuard, RequireAdminRole } from 'apps/api/src/guards';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { Skill } from '@app/common/database/entities/Skill.entity';
import { CreateSkillDto, UpdateSkillDto, SuggestSkillDto } from './dto';

@Controller('skills')
export class SkillsController {
  constructor(private skillsService: SkillsService) {}

  // Public / Jobseeker: list/search active skills
  @Get()
  async list(@Query('q') q?: string): Promise<Skill[]> {
    return this.skillsService.searchSkills(q);
  }

  // Public / Jobseeker: suggest a new skill (creates SUGGESTED)
  @Post('suggest')
  @HttpCode(HttpStatus.CREATED)
  async suggest(@Body() body: SuggestSkillDto): Promise<Skill> {
    return this.skillsService.suggestSkill(body.name);
  }

  // Admin: create (Vetting Specialist manages candidate quality control)
  @UseGuards(AdminJwtGuard)
  @RequireAdminRole(AdminRole.VETTING_SPECIALIST.role)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateSkillDto): Promise<Skill> {
    return this.skillsService.createSkill(body);
  }

  // Admin: update (Vetting Specialist manages candidate quality control)
  @UseGuards(AdminJwtGuard)
  @RequireAdminRole(AdminRole.VETTING_SPECIALIST.role)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.updateSkill(id, body);
  }

  // Admin: delete (Vetting Specialist manages candidate quality control)
  @UseGuards(AdminJwtGuard)
  @RequireAdminRole(AdminRole.VETTING_SPECIALIST.role)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.skillsService.deleteSkill(id);
  }
}
