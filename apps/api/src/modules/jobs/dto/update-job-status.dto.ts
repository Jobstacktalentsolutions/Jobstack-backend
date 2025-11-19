import { IsEnum } from 'class-validator';
import { JobStatus } from '@app/common/database/entities/schema.enum';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}
