import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  MinLength,
  IsStrongPassword,
  IsPhoneNumber,
  ValidateIf,
} from 'class-validator';

export enum RecruiterType {
  INDIVIDUAL = 'Individual',
  ORGANIZATION = 'Organization',
}

/**
 * Recruiter Registration DTO
 */
export class RecruiterRegistrationDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

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
} from 'apps/api/src/modules/auth/dto/auth.dto';
