import { NestFactory } from '@nestjs/core';
import { BackgroundModule } from './background.module';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(BackgroundModule);
  await app.listen(app.get(ConfigService).get('PORT') ?? 3000);
  app.useLogger(app.get(Logger));
}
bootstrap();
