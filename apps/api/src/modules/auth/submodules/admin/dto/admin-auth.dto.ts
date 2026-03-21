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
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for requesting the default password change token.
 */
export class AdminDefaultPasswordChangeRequestDto {
  @ApiProperty({ example: 'admin@jobstack.ng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'TempPass12', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  currentPassword: string;
}

/**
 * DTO for completing the default password change flow with a new password.
 */
export class AdminDefaultPasswordChangeDto {
  @ApiProperty({
    example: 'default-change-token-from-email',
  })
  @IsString()
  resetToken: string;

  @ApiProperty({ example: 'N3wAdm1nP@ss', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  newPassword: string;
}
