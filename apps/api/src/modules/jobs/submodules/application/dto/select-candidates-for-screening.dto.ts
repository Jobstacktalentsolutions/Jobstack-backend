import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO describing a single candidate selected for screening
export class CandidateForScreeningDto {
  @ApiProperty({ example: 'c3b2b0c8-1a23-4f6e-9a8b-1234567890ab' })
  @IsUUID()
  applicationId: string;

  @ApiProperty({
    example: 'https://meet.example.com/screening-abc',
  })
  @IsString()
  meetingLink: string;

  @ApiProperty({
    description: 'Scheduled screening time (ISO 8601)',
    example: '2026-03-22T10:00:00.000Z',
  })
  @IsString()
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'Prep notes for the candidate',
    example: 'Please review the take-home spec linked in the job post.',
  })
  @IsOptional()
  @IsString()
  prepInfo?: string;

  @ApiProperty({
    description: 'Duration in minutes (1–480)',
    example: 45,
    minimum: 1,
    maximum: 480,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes: number;
}

// DTO for selecting multiple candidates for screening
export class SelectCandidatesForScreeningDto {
  @ApiProperty({ type: [CandidateForScreeningDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateForScreeningDto)
  candidates: CandidateForScreeningDto[];
}
