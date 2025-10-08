import { UserRole } from '../../../../../../libs/common/src/shared/enums/user-roles.enum';

/**
 * Authentication Result
 */
export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    profileId?: string;
    firstName?: string;
    lastName?: string;
  };
  expiresAt: Date;
  sessionId: string;
}

/**
 * Email Verification Result
 */
export interface EmailVerificationResult {
  sent: boolean;
  waitTime?: number;
  message?: string;
}

/**
 * Password Reset Request Result
 */
export interface PasswordResetRequestResult {
  sent: boolean;
  waitTime?: number;
  message?: string;
}

/**
 * Password Reset Confirmation Result
 */
export interface PasswordResetConfirmationResult {
  resetToken: string;
  expiresAt: Date;
}
