import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from '@config/swagger.config';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { LoggerService } from '@common/logger/logger.service';
import { initSentry } from '@config/sentry.config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);

  const trustProxy = configService.get<string>('app.trustProxy') || 'loopback';
  app.set('trust proxy', trustProxy);

  initSentry(configService.get<string>('sentry.dsn'));

  const rawCorsOrigin = configService.get<string>('cors.origin') ?? '';
  const allowedOrigins = rawCorsOrigin
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const isProduction = configService.get<string>('app.env') === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.length === 0) {
        // In non-production, if no explicit origins are set, allow localhost
        return callback(null, !isProduction);
      }
      if (
        allowedOrigins.includes(origin) ||
        (!isProduction && allowedOrigins.includes('*'))
      ) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS origin '${origin}' not allowed by policy`),
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Request-Id',
    ],
  });

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`], // Required for Swagger UI
          styleSrc: [`'self'`, `'unsafe-inline'`], // Required for Swagger UI
          imgSrc: [`'self'`, 'data:', 'https://validator.swagger.io'],
          fontSrc: [`'self'`, 'data:'],
          objectSrc: [`'none'`],
          frameAncestors: [`'none'`],
        },
      },
      frameguard: {
        action: 'deny',
      },
      xContentTypeOptions: true,
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      dnsPrefetchControl: {
        allow: false,
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new ResponseInterceptor(),
  );

  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document);

  const appPort = configService.get<number>('app.port') ?? 3000;

  await app.listen(appPort);
}

bootstrap().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});
