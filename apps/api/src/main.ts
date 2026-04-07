import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';
import { ConfigService } from '@nestjs/config';
import { ENV } from 'apps/api/src/modules/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppEnum } from 'apps/api/src/modules/config/app.config';
import helmet from 'helmet';
import type { Request, Response } from 'express';
import {
  DocumentBuilder,
  SwaggerModule,
  type OpenAPIObject,
} from '@nestjs/swagger';

type OpenApiSchema = Record<string, any>;
type OpenApiMedia = {
  schema?: OpenApiSchema;
  example?: unknown;
  examples?: unknown;
};
type OpenApiResponse = {
  description?: string;
  content?: Record<string, OpenApiMedia>;
  [key: string]: unknown;
};
type OpenApiOperation = {
  requestBody?: {
    content?: Record<string, OpenApiMedia>;
    [key: string]: unknown;
  };
  responses?: Record<string, OpenApiResponse>;
  [key: string]: unknown;
};

// Build an example object from a Swagger schema (including $ref/allOf/arrays).
function schemaToExample(
  schema: OpenApiSchema | undefined,
  schemas: Record<string, OpenApiSchema>,
  seen = new Set<string>(),
): unknown {
  if (!schema) return undefined;
  if (schema.example !== undefined) return schema.example;

  if (schema.$ref && typeof schema.$ref === 'string') {
    const name = schema.$ref.split('/').pop();
    if (!name || seen.has(name)) return undefined;
    seen.add(name);
    return schemaToExample(schemas[name], schemas, seen);
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    const merged: Record<string, unknown> = {};
    for (const part of schema.allOf) {
      const value = schemaToExample(part, schemas, new Set(seen));
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(merged, value);
      }
    }
    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return schemaToExample(schema.oneOf[0], schemas, seen);
  }

  if (schema.type === 'array') {
    const item = schemaToExample(schema.items, schemas, seen);
    return item !== undefined ? [item] : [];
  }

  if (schema.type === 'object' || schema.properties) {
    const props = schema.properties ?? {};
    const out: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(props)) {
      const value = schemaToExample(
        propSchema as OpenApiSchema,
        schemas,
        new Set(seen),
      );
      if (value !== undefined) out[key] = value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }

  if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  }
  if (schema.default !== undefined) return schema.default;

  switch (schema.type) {
    case 'string':
      return 'string';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    default:
      return undefined;
  }
}

// Ensure every operation has useful request/response examples in Swagger UI.
function hydrateSwaggerExamples(document: OpenAPIObject): void {
  const schemas = (document.components?.schemas ?? {}) as Record<
    string,
    OpenApiSchema
  >;

  for (const pathItem of Object.values(document.paths)) {
    if (!pathItem) continue;

    for (const operation of Object.values(pathItem)) {
      if (!operation || typeof operation !== 'object') continue;

      const openApiOperation = operation as OpenApiOperation;

      const requestContent = openApiOperation.requestBody?.content ?? {};
      for (const media of Object.values(requestContent)) {
        if (!media?.schema) continue;
        if (media.example !== undefined || media.examples !== undefined)
          continue;
        const generated = schemaToExample(media.schema, schemas);
        if (generated !== undefined) media.example = generated;
      }

      const responses = (openApiOperation.responses ??= {});
      if (Object.keys(responses).length === 0) {
        responses['200'] = {
          description: 'Successful response',
          content: {
            'application/json': {
              example: {
                success: true,
                data: {},
                requestId: 'req_1234567890',
              },
            },
          },
        };
      }

      for (const response of Object.values(responses)) {
        const content = response?.content ?? {};
        for (const media of Object.values(content)) {
          if (!media) continue;
          if (media.example !== undefined || media.examples !== undefined)
            continue;

          const generated = schemaToExample(media.schema, schemas);
          if (generated !== undefined) {
            media.example = generated;
            continue;
          }

          media.example = {
            success: true,
            data: {},
            requestId: 'req_1234567890',
          };
        }
      }
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(ApiModule, {
    // logger: ['error', 'warn'], // Only log errors and warnings
  });
  const logger = new Logger('HttpErrorMiddleware');

  app.use((request: Request, response: Response, next: () => void) => {
    const start = Date.now();

    response.on('finish', () => {
      const statusCode = response.statusCode;
      if (statusCode < 400) return;

      const durationMs = Date.now() - start;
      const requestIdHeader = response.getHeader('x-request-id');
      const requestId =
        typeof requestIdHeader === 'string' ? requestIdHeader : undefined;

      const message = `${request.method} ${request.originalUrl} -> ${statusCode} (${durationMs}ms)`;
      const context = requestId ? `requestId=${requestId}` : undefined;

      if (statusCode >= 500) {
        logger.error(message, context);
        return;
      }

      logger.warn(context ? `${message} ${context}` : message);
    });

    next();
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
  hydrateSwaggerExamples(openApiDocument);
  SwaggerModule.setup('docs', app, openApiDocument);

  // Bind to 0.0.0.0 for Railway deployment compatibility
  const port = process.env.PORT || app.get(ConfigService).get(ENV.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
