import { ConfigService } from '@nestjs/config';
import { HelmetOptions } from 'helmet';
import { ENV } from 'apps/api/src/modules/config/env.config';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const HELMET_OPTIONS: HelmetOptions = {
  contentSecurityPolicy: false,
};

const configService = new ConfigService();

const CORS_OPTIONS: CorsOptions = {
  origin: [
    /^(http:\/\/localhost:\d+)$/,
    configService.get(ENV.FRONTEND_URL, 'http://localhost:3000'),
    'https://jobstack.org',
    'https://www.jobstack.org',
    'https://jobstackwebsite-frontend.vercel.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Access-Control-Expose-Headers',
  ],
  credentials: true,
};

export const AppEnum = {
  PORT: configService.get(ENV.PORT) || '3000',
  NODE_ENV: configService.get(ENV.NODE_ENV) || 'development',
  CORS_OPTIONS,
  HELMET_OPTIONS,
  DATABASE_URL: configService.get(ENV.DATABASE_URL),
  // JWT_SECRET: configService.get(ENV.JWT_SECRET_KEY),
};
