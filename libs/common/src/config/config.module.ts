import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ENV } from './env.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        [ENV.PORT]: Joi.number().required(),
      }),
    }),
  ],
})
export class ConfigModule {}
