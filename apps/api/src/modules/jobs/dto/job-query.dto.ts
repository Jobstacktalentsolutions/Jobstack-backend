import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  SkillCategory,
  JobStatus,
  EmploymentType,
  EmploymentArrangement,
  WorkMode,
} from '@app/common/database/entities/schema.enum';

/** Sort options for paginated job listings (explore and bookmarks). */
export enum JobListSortBy {
  MOST_RELEVANT = 'MOST_RELEVANT',
  MOST_RECENT = 'MOST_RECENT',
  SALARY_LOW_HIGH = 'SALARY_LOW_HIGH',
  SALARY_HIGH_LOW = 'SALARY_HIGH_LOW',
}

// Normalizes query params so a single scalar becomes a one-element array for multi-select filters.
function toOptionalStringArray({
  value,
}: {
  value: unknown;
}): string[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? (value as unknown[]) : [value];
  const filtered = raw
    .map((v) => (v === undefined || v === null ? '' : String(v)))
    .filter((s) => s !== '');
  return filtered.length ? filtered : undefined;
}

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

  @ApiPropertyOptional({
    enum: SkillCategory,
    isArray: true,
    description:
      'Multiple categories; takes precedence over single category when set',
  })
  @IsOptional()
  @Transform(toOptionalStringArray)
  @IsArray()
  @IsEnum(SkillCategory, { each: true })
  categories?: SkillCategory[];

  @ApiPropertyOptional({ description: 'Free-text search', example: 'engineer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EmploymentType, isArray: true })
  @IsOptional()
  @Transform(toOptionalStringArray)
  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  employmentTypes?: EmploymentType[];

  @ApiPropertyOptional({ enum: EmploymentArrangement, isArray: true })
  @IsOptional()
  @Transform(toOptionalStringArray)
  @IsArray()
  @IsEnum(EmploymentArrangement, { each: true })
  employmentArrangements?: EmploymentArrangement[];

  @ApiPropertyOptional({ enum: WorkMode, isArray: true })
  @IsOptional()
  @Transform(toOptionalStringArray)
  @IsArray()
  @IsEnum(WorkMode, { each: true })
  workModes?: WorkMode[];

  @ApiPropertyOptional({
    example: 50_000,
    description:
      'Min total compensation (salary or contract fee); jobs with no amount still match',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1e12)
  minCompensation?: number;

  @ApiPropertyOptional({
    example: 1_000_000,
    description:
      'Max total compensation (salary or contract fee); jobs with no amount still match',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1e12)
  maxCompensation?: number;

  @ApiPropertyOptional({
    example: 7,
    description: 'Only jobs created within the last N days',
    minimum: 1,
    maximum: 365,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  postedWithinDays?: number;

  @ApiPropertyOptional({ enum: JobListSortBy })
  @IsOptional()
  @IsEnum(JobListSortBy)
  sortBy?: JobListSortBy;

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
