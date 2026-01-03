import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DayOfWeek,
  EmploymentArrangement,
  EmploymentType,
  SkillCategory,
  WorkMode,
  ContractPaymentType,
} from '@app/common/database/entities/schema.enum';

export class CreateJobDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(20)
  description: string;

  @IsEnum(SkillCategory)
  category: SkillCategory;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsEnum(EmploymentArrangement)
  employmentArrangement: EmploymentArrangement;

  @IsEnum(WorkMode)
  workMode: WorkMode;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'salaryMin must be numeric' })
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'salaryMax must be numeric' })
  salaryMax?: number;

  // Contract compensation fields
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'contractFeeMin must be numeric' },
  )
  contractFeeMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'contractFeeMax must be numeric' },
  )
  contractFeeMax?: number;

  @IsOptional()
  @IsEnum(ContractPaymentType)
  contractPaymentType?: ContractPaymentType;

  // Contract duration display field
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'contractDurationDays must be numeric' })
  contractDurationDays?: number;

  // Generic start/end dates (for tracking purposes)
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  workDays?: DayOfWeek[];

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  skillIds: string[];
}
