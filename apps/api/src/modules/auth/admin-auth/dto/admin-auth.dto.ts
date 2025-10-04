/**
 * Re-export common DTOs for Admin authentication
 * Admin uses the base DTOs without additional fields
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
