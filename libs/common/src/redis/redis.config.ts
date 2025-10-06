/**
 * Redis key patterns for different data types
 */
export const REDIS_KEYS = {
  // Session Management
  USER_SESSION: (sessionId: string) => `session:user:${sessionId}`,
  ACCESS_TOKEN_BLACKLIST: (tokenId: string) => `blacklist:access:${tokenId}`,
  REFRESH_TOKEN_BLACKLIST: (tokenId: string) => `blacklist:refresh:${tokenId}`,

  // Email Verification
  EMAIL_VERIFICATION_CODE: (email: string) => `verification:email:${email}`,
  EMAIL_VERIFICATION_ATTEMPTS: (email: string) =>
    `verification:email:attempts:${email}`,

  // Password Reset
  PASSWORD_RESET_CODE: (userId: string) => `reset_password:${userId}`,
  PASSWORD_RESET_ATTEMPTS: (identifier: string) =>
    `reset_password:attempts:${identifier}`,

  // Rate Limiting
  RATE_LIMIT: (identifier: string) => `rate_limit:${identifier}`,

  // TTL Constants
  SESSION_TTL: 24 * 60 * 60, // 24 hours
  ACCESS_TOKEN_TTL: 15 * 60, // 15 minutes
  REFRESH_TOKEN_TTL: 7 * 24 * 60 * 60, // 7 days
  VERIFICATION_TTL: 10 * 60, // 10 minutes
  PASSWORD_RESET_TTL: 15 * 60, // 15 minutes
  RATE_LIMIT_TTL: 60, // 1 minute

  // Contact Change Flows
  PENDING_EMAIL_CHANGE: (userId: string) => `change:email:target:${userId}`,
  EMAIL_CHANGE_CODE: (userId: string) => `change:email:code:${userId}`,
  PENDING_PHONE_CHANGE: (userId: string) => `change:phone:target:${userId}`,
  PHONE_CHANGE_CODE: (userId: string) => `change:phone:code:${userId}`,
} as const;
