import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'apps/api/src/modules/config';
import { ValidationPipe } from '@nestjs/common';
import { AppEnum } from 'apps/api/src/modules/config/app.config';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule, {
    // logger: ['error', 'warn'], // Only log errors and warnings
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors(AppEnum.CORS_OPTIONS);
  app.use(helmet(AppEnum.HELMET_OPTIONS));
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('JobStack API')
    .setDescription('JobStack marketplace HTTP API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, openApiDocument);

  // Bind to 0.0.0.0 for Railway deployment compatibility
  const port = process.env.PORT || app.get(ConfigService).get(ENV.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
