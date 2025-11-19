import { IsEnum, IsOptional, IsString } from 'class-validator';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';

export class UpdateApplicationStatusDto {
  @IsEnum(JobApplicationStatus)
  status: JobApplicationStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
