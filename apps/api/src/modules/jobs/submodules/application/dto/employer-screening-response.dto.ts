import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

// Captures employer response to a scheduled screening (accept or propose new time)
export class EmployerScreeningResponseDto {
  @IsBoolean()
  accepted: boolean;

  @IsOptional()
  @IsDateString()
  proposedTime?: string;
}

