import { IsString, IsArray, IsOptional } from 'class-validator';
import { BaseRegistrationDto } from '@app/common/shared/dto/auth.dto';

/**
 * JobSeeker Registration DTO
 */
export class JobSeekerRegistrationDto extends BaseRegistrationDto {
  @IsArray()
  @IsString({ each: true })
  skills: string[];

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
} from '@app/common/shared/dto/auth.dto';
