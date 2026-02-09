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
  IsBoolean,
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
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'salary must be numeric' })
  salary?: number;

  // Contract compensation fields
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'contractFee must be numeric' })
  contractFee?: number;

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

  @IsOptional()
  @IsBoolean()
  performCustomScreening?: boolean;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  skillIds: string[];
}
