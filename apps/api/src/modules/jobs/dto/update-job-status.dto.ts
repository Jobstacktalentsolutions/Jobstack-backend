import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '@app/common/database/entities/schema.enum';

export class UpdateJobStatusDto {
  @ApiProperty({ enum: JobStatus, example: JobStatus.PUBLISHED })
  @IsEnum(JobStatus)
  status: JobStatus;
}
