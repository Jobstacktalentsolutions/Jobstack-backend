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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import {
  AdminJwtGuard,
  EmployerJwtGuard,
  JobSeekerJwtGuard,
  RequireAdminRole,
} from 'apps/api/src/guards';
import { AdminRole } from '@app/common/shared/enums/roles.enum';
import { Skill } from '@app/common/database/entities/Skill.entity';
import { AddSkillDto, CreateSkillDto, UpdateSkillDto } from './dto';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private skillsService: SkillsService) {}

  // Public: list/search active skills
  @Get()
  async list(@Query('q') q?: string): Promise<Skill[]> {
    return this.skillsService.searchSkills(q);
  }

  /**
   * Authenticated users (jobseekers or employers) can add a new skill directly
   * as ACTIVE. If the skill already exists (case-insensitive), it is returned
   * as-is. The caller must supply the work sector (category) the skill belongs
   * to so the backend can correctly classify it.
   */
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new skill (jobseeker or employer)' })
  @ApiBody({ type: AddSkillDto })
  async add(@Body() body: AddSkillDto): Promise<Skill> {
    return this.skillsService.addSkill(body.name, body.category);
  }

  // Admin: create (Vetting Specialist manages candidate quality control)
  @UseGuards(AdminJwtGuard)
  @RequireAdminRole(AdminRole.VETTING_SPECIALIST.role)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create skill (vetting specialist)' })
  @ApiBody({ type: CreateSkillDto })
  async create(@Body() body: CreateSkillDto): Promise<Skill> {
    return this.skillsService.createSkill(body);
  }

  // Admin: update (Vetting Specialist manages candidate quality control)
  @UseGuards(AdminJwtGuard)
  @RequireAdminRole(AdminRole.VETTING_SPECIALIST.role)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update skill (vetting specialist)' })
  @ApiBody({ type: UpdateSkillDto })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete skill (vetting specialist)' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.skillsService.deleteSkill(id);
  }
}
