import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { ENV } from 'apps/api/src/modules/config';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);
  app.setGlobalPrefix('api');
  app.useLogger(app.get(Logger));
  await app.listen(app.get(ConfigService).get(ENV.PORT) ?? 3000);
}
bootstrap();
