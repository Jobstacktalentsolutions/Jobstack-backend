import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO for picking a single application as the screened candidate for a job
export class PickScreeningCandidateDto {
  @ApiProperty({ example: 'c3b2b0c8-1a23-4f6e-9a8b-1234567890ab' })
  @IsUUID()
  applicationId: string;

  @ApiPropertyOptional({
    example: 'Strong system design and clear communication.',
  })
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional({ example: 'Limited experience with our exact stack.' })
  @IsOptional()
  @IsString()
  concerns?: string;

  @ApiPropertyOptional({
    example: 'Recommended for offer after technical interview.',
  })
  @IsOptional()
  @IsString()
  interviewFeedback?: string;
}
