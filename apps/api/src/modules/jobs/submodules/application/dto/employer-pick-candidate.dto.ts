import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class EmployerPickCandidateDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  concerns?: string;

  @IsString()
  @IsOptional()
  interviewFeedback?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
