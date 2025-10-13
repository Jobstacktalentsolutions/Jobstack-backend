import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  Length,
  Matches,
  IsStrongPassword,
} from 'class-validator';
import { UserRole } from '../../../../../../libs/common/src/shared/enums/user-roles.enum';

/**
 * Base Login DTO
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

/**
 * Refresh Token DTO
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

/**
 * Email Verification Request DTO
 */
export class EmailVerificationRequestDto {
  @IsEmail()
  email: string;
}

/**
 * Email Verification Confirm DTO
 */
export class EmailVerificationConfirmDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters' })
  code: string;
}

/**
 * Password Reset Request DTO
 */
export class PasswordResetRequestDto {
  @IsEmail()
  email: string;
}

/**
 * Password Reset Confirm Code DTO
 */
export class PasswordResetConfirmCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6, { message: 'Reset code must be exactly 6 characters' })
  code: string;
}

/**
 * Password Reset DTO
 */
export class PasswordResetDto {
  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  newPassword: string;
}

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
