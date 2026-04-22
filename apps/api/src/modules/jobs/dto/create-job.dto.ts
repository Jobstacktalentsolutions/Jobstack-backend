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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DayOfWeek,
  EmploymentArrangement,
  EmploymentType,
  SkillCategory,
  WorkMode,
  ContractPaymentType,
} from '@app/common/database/entities/schema.enum';

export class CreateJobDto {
  @ApiProperty({
    description: 'Job title shown to candidates',
    example: 'Senior Backend Engineer',
    minLength: 3,
    maxLength: 120,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({
    description: 'Full role description',
    example:
      'We need a NestJS engineer to build APIs and integrations for our Lagos-based team.',
    minLength: 20,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @ApiProperty({
    description: 'Primary skill category for the role',
    enum: SkillCategory,
    example: SkillCategory.SOFTWARE_DEVELOPMENT,
  })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiProperty({
    description: 'Employment type',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'Permanent vs contract arrangement',
    enum: EmploymentArrangement,
    example: EmploymentArrangement.PERMANENT_EMPLOYEE,
  })
  @IsEnum(EmploymentArrangement)
  employmentArrangement: EmploymentArrangement;

  @ApiProperty({
    description: 'Work location mode',
    enum: WorkMode,
    example: WorkMode.REMOTE,
  })
  @IsEnum(WorkMode)
  workMode: WorkMode;

  @ApiPropertyOptional({
    description: 'Monthly salary in employer currency (when applicable)',
    example: 450000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'salary must be numeric' })
  salary?: number;

  @ApiPropertyOptional({
    description: 'Total contract fee for contract roles',
    example: 2500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'contractFee must be numeric' })
  contractFee?: number;

  @ApiPropertyOptional({
    description: 'How the contract fee is structured',
    enum: ContractPaymentType,
    example: ContractPaymentType.MONTHLY_CONTRACT,
  })
  @IsOptional()
  @IsEnum(ContractPaymentType)
  contractPaymentType?: ContractPaymentType;

  @ApiPropertyOptional({
    description: 'Contract length in days (display / tracking)',
    example: 90,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'contractDurationDays must be numeric' })
  contractDurationDays?: number;

  @ApiPropertyOptional({
    description: 'Role start date (ISO 8601)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Role end date for fixed-term roles (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'State or region', example: 'Lagos' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Lagos' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Street address when on-site',
    example: '12 Admiralty Way, Lekki Phase 1',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Working days',
    enum: DayOfWeek,
    isArray: true,
    example: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  workDays?: DayOfWeek[];

  @ApiPropertyOptional({
    description: 'Daily start time (local)',
    example: '09:00',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Daily end time (local)',
    example: '17:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Search / filter tags',
    example: ['nestjs', 'postgresql'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Last date applications are accepted (ISO 8601)',
    example: '2026-03-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  applicationDeadline?: string;

  @ApiProperty({
    description: 'Skill IDs required for the role',
    type: [String],
    example: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  skillIds: string[];
}
