import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { HealthModule } from '../../../src/modules/health/health.module';
import { HealthService } from '../../../src/modules/health/health.service';
import { LoggerService } from '../../../src/common/logger/logger.service';
import { LoggerMiddleware } from '../../../src/common/middleware/logger.middleware';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../../../src/common/interceptors/response.interceptor';

describe('Security Headers & Hardening (e2e)', () => {
  let app: INestApplication;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  } as unknown as LoggerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    })
      .overrideProvider(HealthService)
      .useValue({
        check: jest.fn().mockResolvedValue({
          status: 'ok',
          timestamp: new Date().toISOString(),
          checks: { database: { status: 'up' }, redis: { status: 'up' } },
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });

    app.use(cookieParser());
    app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
          directives: {
            defaultSrc: [`'self'`],
            scriptSrc: [`'self'`, `'unsafe-inline'`],
            styleSrc: [`'self'`, `'unsafe-inline'`],
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
      }),
    );

    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    });

    const loggerMiddleware = new LoggerMiddleware(mockLogger);
    app.use(loggerMiddleware.use.bind(loggerMiddleware));

    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(mockLogger));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sets expected security headers (X-Content-Type-Options, X-Frame-Options, CSP)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toContain(
      "frame-ancestors 'none'",
    );
  });

  it('propagates or generates X-Request-Id header on responses', async () => {
    const customId = 'req-trace-abc-123';
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-request-id', customId)
      .expect(200);

    expect(response.headers['x-request-id']).toBe(customId);
  });

  it('handles CORS allowed origin with credentials', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('redacts sensitive query parameters from 404/error response paths', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/nonexistent?token=super-secret-value&other=normal')
      .expect(404);

    const body = response.body as { path?: string };
    expect(body.path).toBeDefined();
    expect(body.path).toContain('token=[REDACTED]');
    expect(body.path).not.toContain('super-secret-value');
    expect(body.path).toContain('other=normal');
  });
});
