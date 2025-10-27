import { SkillStatus } from '@app/common/database/entities/schema.enum';
import { CreateSkillDto } from './create-skill.dto';
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {
  @IsOptional()
  @IsEnum(SkillStatus)
  status?: SkillStatus;
}
