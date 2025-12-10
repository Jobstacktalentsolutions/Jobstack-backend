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
 * Change Password DTO for Admin (email + password only)
 * Used when admin needs to change their default password
 */
export class AdminChangePasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  newPassword: string;
}
