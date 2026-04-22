import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class EmployerSelectForScreeningDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  meetingLink: string;

  @IsDateString()
  scheduledAt: string;

  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes: number;

  @IsString()
  @IsOptional()
  prepInfo?: string;
}
