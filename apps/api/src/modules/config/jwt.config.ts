import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ENV } from './env.config';

/**
 * JWT configuration for the API service
 * Uses RS256 (asymmetric) for all environments for consistent security
 */
export const createJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => {
  const privateKey = configService.get(ENV.JWT_PRIVATE_KEY);
  const publicKey = configService.get(ENV.JWT_PUBLIC_KEY);

  if (!privateKey || !publicKey) {
    throw new Error(
      'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set in all environments',
    );
  }

  const config = {
    privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
    publicKey: publicKey.replace(/\\n/g, '\n'),
    signOptions: {
      algorithm: 'RS256',
      expiresIn: configService.get(ENV.JWT_ACCESS_TOKEN_EXPIRES_IN, '2d'),
      issuer: configService.get(ENV.JWT_ISSUER, 'jobstack-platform'),
      audience: configService.get(ENV.JWT_AUDIENCE, 'jobstack-users'),
    },
    verifyOptions: {
      algorithms: ['RS256'],
      issuer: configService.get(ENV.JWT_ISSUER, 'jobstack-platform'),
      audience: configService.get(ENV.JWT_AUDIENCE, 'jobstack-users'),
    },
  };

  return {
    privateKey: config.privateKey,
    publicKey: config.publicKey,
    signOptions: config.signOptions as JwtSignOptions,
    verifyOptions: config.verifyOptions as any,
  };
};

/**
 * JWT constants for use across the application
 */
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '2d', // 2 days
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days
  EMAIL_VERIFICATION_TOKEN_EXPIRY: '24h', // 24 hours
  PASSWORD_RESET_TOKEN_EXPIRY: '15m', // 15 minutes

  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset',
  },

  CLAIMS: {
    USER_ID: 'sub',
    ROLE: 'role',
    PROFILE_ID: 'profileId',
    SESSION_ID: 'sessionId',
    TOKEN_TYPE: 'type',
    TOKEN_ID: 'jti', // JWT ID for token revocation
  },
} as const;
