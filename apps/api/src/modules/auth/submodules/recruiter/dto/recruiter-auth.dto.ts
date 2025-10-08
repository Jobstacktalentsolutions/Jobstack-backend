import { IsString, IsEnum, IsOptional } from 'class-validator';
import { BaseRegistrationDto } from 'apps/api/src/modules/auth/dto/auth.dto';

export enum RecruiterType {
  INDIVIDUAL = 'Individual',
  ORGANIZATION = 'Organization',
}

/**
 * Recruiter Registration DTO
 */
export class RecruiterRegistrationDto extends BaseRegistrationDto {
  @IsEnum(RecruiterType)
  type: RecruiterType;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  website?: string;
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
