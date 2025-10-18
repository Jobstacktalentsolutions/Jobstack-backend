import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { SkillStatus } from '@app/common/database/entities/Skill.entity';
import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillDto } from './create-skill.dto';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {}
