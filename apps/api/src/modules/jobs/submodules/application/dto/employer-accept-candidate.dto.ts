import { IsOptional, IsString, IsDateString } from 'class-validator';

export class EmployerAcceptCandidateDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
