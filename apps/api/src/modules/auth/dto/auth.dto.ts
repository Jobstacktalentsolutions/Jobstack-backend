import {
  IsEmail,
  IsString,
  MinLength,
  Length,
  Matches,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Login DTO
 */
export class LoginDto {
  @ApiProperty({ example: 'employer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ssw0rd', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

/**
 * Refresh Token DTO
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token from login response',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  refreshToken: string;
}

/**
 * Email Verification Request DTO
 */
export class EmailVerificationRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

/**
 * Email Verification Confirm DTO
 */
export class EmailVerificationConfirmDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters' })
  code: string;
}

/**
 * Password Reset Request DTO
 */
export class PasswordResetRequestDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

/**
 * Password Reset Confirm Code DTO
 */
export class PasswordResetConfirmCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '654321', minLength: 6, maxLength: 6 })
  @IsString()
  @Length(6, 6, { message: 'Reset code must be exactly 6 characters' })
  code: string;
}

/**
 * Password Reset DTO
 */
export class PasswordResetDto {
  @ApiProperty({
    example: 'reset-token-from-email',
  })
  @IsString()
  resetToken: string;

  @ApiProperty({ example: 'N3wStr0ngP@ss', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  newPassword: string;
}

/**
 * Change Password DTO
 */
export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentP@ss1' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewStr0ngP@ss2', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
