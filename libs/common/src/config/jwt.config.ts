import { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ENV } from './env.config';

/**
 * JWT configuration for the API service
 * Uses RS256 (asymmetric) for production security
 * Falls back to HS256 (symmetric) for development
 */
export const createJwtConfig = (
  configService: ConfigService,
): JwtModuleOptions => {
  const environment = configService.get(ENV.NODE_ENV, 'development');

  // Always use RS256 for production
  if (environment === 'production') {
    const privateKey = configService.get(ENV.JWT_PRIVATE_KEY);
    const publicKey = configService.get(ENV.JWT_PUBLIC_KEY);

    if (!privateKey || !publicKey) {
      throw new Error(
        'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set in production',
      );
    }

    const config = {
      privateKey: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
      publicKey: publicKey.replace(/\\n/g, '\n'),
      signOptions: {
        algorithm: 'RS256',
        expiresIn: configService.get(ENV.JWT_ACCESS_TOKEN_EXPIRES_IN, '15m'),
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
  } else {
    // Development: Use HMAC for simplicity
    const config = {
      secret: configService.get(
        ENV.JWT_SECRET,
        'development-secret-key-change-in-production',
      ),
      signOptions: {
        algorithm: 'HS256',
        expiresIn: configService.get(ENV.JWT_ACCESS_TOKEN_EXPIRES_IN, '15m'),
        issuer: configService.get(ENV.JWT_ISSUER, 'jobstack-platform'),
        audience: configService.get(ENV.JWT_AUDIENCE, 'jobstack-users'),
      },
      verifyOptions: {
        algorithms: ['HS256'],
        issuer: configService.get(ENV.JWT_ISSUER, 'jobstack-platform'),
        audience: configService.get(ENV.JWT_AUDIENCE, 'jobstack-users'),
      },
    };

    return {
      secret: config.secret,
      signOptions: config.signOptions as JwtSignOptions,
      verifyOptions: config.verifyOptions as any,
    };
  }
};

/**
 * JWT constants for use across the application
 */
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes
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
