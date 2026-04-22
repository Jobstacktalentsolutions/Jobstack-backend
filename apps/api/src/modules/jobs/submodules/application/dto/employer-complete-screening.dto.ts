import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class EmployerCompleteScreeningDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  applicationIds: string[];

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  concerns?: string;

  @IsString()
  @IsOptional()
  interviewFeedback?: string;
}
