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
import { AdminJwtGuard, JobSeekerJwtGuard } from 'apps/api/src/guards';
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

  // Admin: create
  @UseGuards(AdminJwtGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateSkillDto): Promise<Skill> {
    return this.skillsService.createSkill(body);
  }

  // Admin: update
  @UseGuards(AdminJwtGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateSkillDto,
  ): Promise<Skill> {
    return this.skillsService.updateSkill(id, body);
  }

  // Admin: delete
  @UseGuards(AdminJwtGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.skillsService.deleteSkill(id);
  }
}
