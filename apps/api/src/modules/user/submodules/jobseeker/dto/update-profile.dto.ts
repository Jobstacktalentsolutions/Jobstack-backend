import { RecruiterType } from '@app/common/database/entities/schema.enum';
import { IsString, IsOptional, IsArray, IsUUID, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  brief?: string;

  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[]; // Free-text skill names

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  skillIds?: string[]; // Existing skill IDs

  
}
