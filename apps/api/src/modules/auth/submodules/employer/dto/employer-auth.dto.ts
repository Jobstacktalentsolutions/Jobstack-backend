import {
  IsString,
  IsEnum,
  IsOptional,
  IsEmail,
  MinLength,
  IsStrongPassword,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EmployerType } from '@app/common/database/entities/schema.enum';

/**
 * Employer Registration DTO
 */
export class EmployerRegistrationDto {
  @ApiProperty({ example: 'hr@acme.ng' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngH1re!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  @IsPhoneNumber('NG')
  phoneNumber: string;

  @ApiPropertyOptional({
    enum: EmployerType,
    example: EmployerType.SME,
  })
  @IsOptional()
  @IsEnum(EmployerType)
  type?: EmployerType;
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
