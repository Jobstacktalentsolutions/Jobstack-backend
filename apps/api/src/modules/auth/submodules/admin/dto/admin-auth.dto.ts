/**
 * Re-export common DTOs for Admin authentication
 * Admin uses the base DTOs without additional fields
 */
export {
  LoginDto,
  RefreshTokenDto,
  PasswordResetRequestDto,
  PasswordResetConfirmCodeDto,
  PasswordResetDto,
} from 'apps/api/src/modules/auth/dto/auth.dto';

import {
  IsEmail,
  IsString,
  MinLength,
  IsStrongPassword,
} from 'class-validator';

/**
 * DTO for requesting the default password change token.
 */
export class AdminDefaultPasswordChangeRequestDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  currentPassword: string;
}

/**
 * DTO for completing the default password change flow with a new password.
 */
export class AdminDefaultPasswordChangeDto {
  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  newPassword: string;
}
