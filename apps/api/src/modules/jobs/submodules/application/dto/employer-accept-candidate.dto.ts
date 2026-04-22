import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EmployerAcceptCandidateDto {
  @ApiPropertyOptional({
    description: 'Planned start date (ISO 8601)',
    example: '2026-04-15',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Notes stored on the hire record',
    example: '6-month probation, remote-first.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
