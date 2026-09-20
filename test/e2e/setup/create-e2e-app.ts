import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TestingModuleBuilder } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../../src/common/interceptors/response.interceptor';
import { LoggerService } from '../../../src/common/logger/logger.service';

const testLogger = {
  log: () => undefined,
  error: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
  verbose: () => undefined,
} as unknown as LoggerService;

export async function createE2eApp(
  moduleBuilder: TestingModuleBuilder,
): Promise<INestApplication> {
  const moduleFixture = await moduleBuilder.compile();
  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  app.use(cookieParser());

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
  app.useGlobalFilters(new HttpExceptionFilter(testLogger));

  await app.init();

  return app;
}
