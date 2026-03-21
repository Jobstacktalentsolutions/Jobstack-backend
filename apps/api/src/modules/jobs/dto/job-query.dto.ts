import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  SkillCategory,
  JobStatus,
} from '@app/common/database/entities/schema.enum';

export class JobQueryDto {
  @ApiPropertyOptional({ enum: JobStatus, example: JobStatus.PUBLISHED })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({
    enum: SkillCategory,
    example: SkillCategory.SOFTWARE_DEVELOPMENT,
  })
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiPropertyOptional({ description: 'Free-text search', example: 'engineer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
