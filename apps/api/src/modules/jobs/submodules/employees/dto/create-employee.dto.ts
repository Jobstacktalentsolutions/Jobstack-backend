import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmployeeStatus,
  EmploymentArrangement,
  EmploymentType,
  ContractPaymentType,
} from '@app/common/database/entities/schema.enum';

export class CreateEmployeeDto {
  @ApiProperty({
    description: 'Job the hire is tied to',
    example: 'c3b2b0c8-1a23-4f6e-9a8b-1234567890ab',
  })
  @IsUUID()
  jobId: string;

  @ApiProperty({
    description: 'Jobseeker profile being hired',
    example: 'd4c3b2a1-2b34-5c67-d890-123456789abc',
  })
  @IsUUID()
  jobseekerProfileId: string;

  @ApiProperty({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({
    enum: EmploymentArrangement,
    example: EmploymentArrangement.PERMANENT_EMPLOYEE,
  })
  @IsEnum(EmploymentArrangement)
  employmentArrangement: EmploymentArrangement;

  @ApiPropertyOptional({
    enum: EmployeeStatus,
    example: EmployeeStatus.ONBOARDING,
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({
    description: 'Employment start date (ISO 8601)',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Employment end date when applicable (ISO 8601)',
    example: '2026-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Agreed salary', example: 400000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'salaryOffered must be numeric' },
  )
  salaryOffered?: number;

  @ApiPropertyOptional({ description: 'Agreed contract fee', example: 1800000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'contractFeeOffered must be numeric' },
  )
  contractFeeOffered?: number;

  @ApiPropertyOptional({
    enum: ContractPaymentType,
    example: ContractPaymentType.MONTHLY_CONTRACT,
  })
  @IsOptional()
  @IsEnum(ContractPaymentType)
  contractPaymentType?: ContractPaymentType;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Internal notes for the hire',
    example: 'Starts after background check clears.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
