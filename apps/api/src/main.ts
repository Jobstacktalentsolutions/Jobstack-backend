import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ENV } from 'apps/api/src/modules/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.setGlobalPrefix('api');
  app.useLogger(app.get(Logger));
  await app.listen(app.get(ConfigService).get(ENV.PORT) ?? 3000);
}
bootstrap();
