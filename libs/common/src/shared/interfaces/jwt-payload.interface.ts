import { UserRole } from '../enums/user-roles.enum';

/**
 * Base JWT Payload structure
 */
export interface BaseJWTPayload {
  id: string; // User ID
  role: UserRole; // User role
  profileId?: string; // Profile ID (for Recruiter and JobSeeker)
  sessionId: string; // Session ID for revocation
  type: 'access' | 'refresh'; // Token type
  jti: string; // JWT ID for blacklisting
  iat: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Access Token Payload
 */
export interface AccessTokenPayload extends BaseJWTPayload {
  type: 'access';
}

/**
 * Refresh Token Payload
 */
export interface RefreshTokenPayload extends BaseJWTPayload {
  type: 'refresh';
}

/**
 * Email Verification Token Payload
 */
export interface EmailVerificationTokenPayload {
  email: string;
  userId: string;
  type: 'email_verification';
  iat: number;
  exp?: number;
}

/**
 * Password Reset Token Payload
 */
export interface PasswordResetTokenPayload {
  userId: string;
  type: 'password_reset';
  iat: number;
  exp?: number;
}

/**
 * Redis Session Data
 */
export interface RedisSessionData {
  userId: string;
  role: UserRole;
  profileId?: string;
  sessionId: string;
  deviceFingerprint?: string;
  lastActivity: number;
}
