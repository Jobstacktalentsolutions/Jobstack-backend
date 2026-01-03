import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeStatus,
  EmploymentArrangement,
  EmploymentType,
  ContractPaymentType,
} from '@app/common/database/entities/schema.enum';

export class CreateEmployeeDto {
  @IsUUID()
  jobId: string;

  @IsUUID()
  jobseekerProfileId: string;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsEnum(EmploymentArrangement)
  employmentArrangement: EmploymentArrangement;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'salaryOffered must be numeric' },
  )
  salaryOffered?: number;

  // Contract compensation fields
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'contractFeeOffered must be numeric' },
  )
  contractFeeOffered?: number;

  @IsOptional()
  @IsEnum(ContractPaymentType)
  contractPaymentType?: ContractPaymentType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
