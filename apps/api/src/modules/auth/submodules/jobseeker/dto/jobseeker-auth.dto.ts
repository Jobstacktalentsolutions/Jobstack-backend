import {
  IsString,
  MinLength,
  IsEmail,
  IsStrongPassword,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * JobSeeker Registration DTO
 */
export class JobSeekerRegistrationDto {
  @ApiProperty({ example: 'dev@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'S3cureP@ss!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'Chidi' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Nwosu' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '+2348099988776' })
  @IsString()
  @IsPhoneNumber('NG')
  phoneNumber: string;
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
  GoogleAuthDto,
} from 'apps/api/src/modules/auth/dto/auth.dto';
