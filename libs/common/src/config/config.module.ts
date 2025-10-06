import { Module } from '@nestjs/common';
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from '@nestjs/config';
import * as Joi from 'joi';
import { ENV } from './env.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        [ENV.NODE_ENV]: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        [ENV.PORT]: Joi.number().port().required(),
        [ENV.DATABASE_URL]: Joi.string().uri().required(),
        [ENV.REDIS_URL]: Joi.string().uri().required(),
        [ENV.REDIS_KEY_PREFIX]: Joi.string().default('jobstack:'),
        [ENV.JWT_PRIVATE_KEY]: Joi.string().required(),
        [ENV.JWT_PUBLIC_KEY]: Joi.string().required(),
        [ENV.JWT_ACCESS_TOKEN_EXPIRES_IN]: Joi.string().required(),
        [ENV.JWT_ISSUER]: Joi.string().required(),
        [ENV.JWT_AUDIENCE]: Joi.string().required(),
        [ENV.BREVO_API_KEY]: Joi.string().required(),
        [ENV.BREVO_FROM_EMAIL]: Joi.string().required(),
        [ENV.BREVO_FROM_NAME]: Joi.string().required(),
        [ENV.COMPANY_NAME]: Joi.string().required(),
        [ENV.SUPPORT_EMAIL]: Joi.string().required(),
        [ENV.WEBSITE_URL]: Joi.string().required(),
        [ENV.RESEND_API_KEY]: Joi.string().required(),
        [ENV.RESEND_FROM_EMAIL]: Joi.string().required(),
        [ENV.RESEND_FROM_NAME]: Joi.string().required(),
        [ENV.TWILIO_ACCOUNT_SID]: Joi.string().required(),
        [ENV.TWILIO_AUTH_TOKEN]: Joi.string().required(),
        [ENV.TWILIO_FROM_NUMBER]: Joi.string().required(),
      } as Record<ENV, Joi.StringSchema | Joi.NumberSchema>),
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
