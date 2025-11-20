import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsPhoneNumber,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  // Basic profile fields
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  brief?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[]; // Free-text skill names

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  skillIds?: string[]; // Existing skill IDs

  @IsOptional()
  minExpectedSalary?: number;

  @IsOptional()
  maxExpectedSalary?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}
