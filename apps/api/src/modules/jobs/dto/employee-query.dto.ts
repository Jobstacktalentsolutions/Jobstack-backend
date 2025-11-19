import { IsEnum, IsInt, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus } from '@app/common/database/entities/schema.enum';

export class EmployeeQueryDto {
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
