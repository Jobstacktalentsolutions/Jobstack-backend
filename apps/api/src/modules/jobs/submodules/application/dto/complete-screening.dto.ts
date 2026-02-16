import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

// DTO for marking screening as complete for a set of applications
export class CompleteScreeningDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  applicationIds: string[];
}

