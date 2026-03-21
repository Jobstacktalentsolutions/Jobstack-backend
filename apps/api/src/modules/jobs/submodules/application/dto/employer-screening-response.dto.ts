import { IsBoolean, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Captures employer response to a scheduled screening (accept or propose new time)
export class EmployerScreeningResponseDto {
  @ApiProperty({ description: 'True if the proposed time works', example: true })
  @IsBoolean()
  accepted: boolean;

  @ApiPropertyOptional({
    description: 'Alternative time when accepted is false (ISO 8601)',
    example: '2026-03-25T14:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  proposedTime?: string;
}
