import { SkillStatus } from '@app/common/database/entities/schema.enum';
import { CreateSkillDto } from './create-skill.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateSkillDto extends PartialType(CreateSkillDto) {
  @ApiPropertyOptional({ enum: SkillStatus, example: SkillStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SkillStatus)
  status?: SkillStatus;
}
