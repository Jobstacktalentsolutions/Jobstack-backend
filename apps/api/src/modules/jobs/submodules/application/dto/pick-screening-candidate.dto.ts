import { IsOptional, IsString, IsUUID } from 'class-validator';

// DTO for picking a single application as the screened candidate for a job
export class PickScreeningCandidateDto {
  @IsUUID()
  applicationId: string;

  @IsOptional()
  @IsString()
  strengths?: string;

  @IsOptional()
  @IsString()
  concerns?: string;

  @IsOptional()
  @IsString()
  interviewFeedback?: string;
}
