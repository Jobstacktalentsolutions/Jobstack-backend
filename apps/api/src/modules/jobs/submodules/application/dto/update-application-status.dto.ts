import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobApplicationStatus } from '@app/common/database/entities/schema.enum';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: JobApplicationStatus,
    example: JobApplicationStatus.VETTED,
  })
  @IsEnum(JobApplicationStatus)
  status: JobApplicationStatus;

  @ApiPropertyOptional({ example: 'Moved forward after phone screen.' })
  @IsOptional()
  @IsString()
  note?: string;
}
