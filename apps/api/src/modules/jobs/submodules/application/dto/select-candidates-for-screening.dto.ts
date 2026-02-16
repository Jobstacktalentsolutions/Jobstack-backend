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

// DTO describing a single candidate selected for screening
export class CandidateForScreeningDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  meetingLink: string;

  @IsString()
  scheduledAt: string; // ISO date string

  @IsOptional()
  @IsString()
  prepInfo?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  durationMinutes: number;
}

// DTO for selecting multiple candidates for screening
export class SelectCandidatesForScreeningDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateForScreeningDto)
  candidates: CandidateForScreeningDto[];
}

