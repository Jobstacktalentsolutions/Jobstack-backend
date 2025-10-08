import {
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { BaseRegistrationDto } from 'apps/api/src/modules/auth/dto/auth.dto';
import { Proficiency } from '@app/common/database/entities/JobseekerSkill.entity';

/**
 * JobSeeker Registration DTO
 */
export class JobSeekerRegistrationDto extends BaseRegistrationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[]; // free-text names

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[]; // normalized ids

  @IsOptional()
  @IsArray()
  skillDetails?: Array<{
    skillId: string;
    proficiency?: Proficiency;
    yearsExperience?: number;
  }>;

  @IsString()
  brief: string;

  @IsOptional()
  @IsString()
  cvUrl?: string;
}

/**
 * Re-export common DTOs for convenience
 */
export {
  LoginDto,
  RefreshTokenDto,
  EmailVerificationRequestDto,
  EmailVerificationConfirmDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
  ChangePasswordDto,
} from 'apps/api/src/modules/auth/dto/auth.dto';
