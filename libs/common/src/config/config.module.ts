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
        [ENV.PORT]: Joi.number().required(),
        [ENV.DATABASE_URL]: Joi.string().uri().required(),
      }),
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
