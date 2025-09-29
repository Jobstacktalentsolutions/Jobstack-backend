import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ENV } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  await app.listen(app.get(ConfigService).get(ENV.PORT) ?? 3000);
  app.useLogger(app.get(Logger));
}
bootstrap();
