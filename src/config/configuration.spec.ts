import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('maps environment variables to application config', () => {
    process.env = {
      ...originalEnv,
      APP_PORT: '4000',
      APP_ENV: 'staging',
      CORS_ORIGIN: 'http://localhost:3001',
      DB_HOST: 'db-host',
      DB_PORT: '5433',
      DB_USER: 'postgres',
      DB_PASSWORD: 'secret',
      DB_NAME: 'authforge_staging',
      JWT_SECRET: 'jwt-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_ACCESS_EXPIRES_IN: '10m',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '30d',
      COOKIE_SECURE: 'true',
      COOKIE_SAME_SITE: 'strict',
      COOKIE_DOMAIN: '.authforge.internal',
      COOKIE_PATH: '/auth',
      COOKIE_ACCESS_NAME: 'af_access',
      COOKIE_REFRESH_NAME: 'af_refresh',
      SWAGGER_ENABLED: 'true',
      SWAGGER_PATH: 'swagger',
      SENTRY_DSN: 'https://dsn.example',
      REDIS_HOST: 'redis-host',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: 'redis-password',
      REDIS_DB: '1',
      REDIS_KEY_PREFIX: 'af:',
      BCRYPT_SALT_ROUNDS: '12',
      RATE_LIMIT_TTL: '120',
      RATE_LIMIT_MAX: '200',
      MAIL_PROVIDER: 'sendgrid',
    };

    expect(configuration()).toEqual({
      app: {
        port: 4000,
        env: 'staging',
      },
      cors: {
        origin: 'http://localhost:3001',
      },
      database: {
        host: 'db-host',
        port: 5433,
        username: 'postgres',
        password: 'secret',
        name: 'authforge_staging',
      },
      jwt: {
        secret: 'jwt-secret',
        expiresIn: '15m',
        accessSecret: 'access-secret',
        accessExpiresIn: '10m',
        refreshSecret: 'refresh-secret',
        refreshExpiresIn: '30d',
      },
      cookies: {
        secure: true,
        sameSite: 'strict',
        domain: '.authforge.internal',
        path: '/auth',
        accessTokenName: 'af_access',
        refreshTokenName: 'af_refresh',
      },
      swagger: {
        enabled: true,
        title: 'AuthForge API',
        description:
          'AuthForge — Authentication & Identity Service API documentation',
        version: '1.0',
        path: 'swagger',
      },
      sentry: {
        dsn: 'https://dsn.example',
      },
      security: {
        bcryptSaltRounds: 12,
        rateLimitTtl: 120,
        rateLimitLimit: 200,
      },
      redis: {
        host: 'redis-host',
        port: 6379,
        password: 'redis-password',
        db: 1,
        keyPrefix: 'af:',
      },
      mail: {
        provider: 'sendgrid',
      },
      nodemailer: {
        host: undefined,
        port: 587,
        user: undefined,
        pass: undefined,
        from: undefined,
      },
      sendgrid: {
        apiKey: undefined,
        from: undefined,
      },
    });
  });

  it('uses defaults when optional values are missing', () => {
    process.env = {
      JWT_SECRET: 'default-secret',
    };

    expect(configuration()).toMatchObject({
      app: {
        port: 3000,
        env: 'development',
      },
      cors: {
        origin: 'http://localhost:3001',
      },
      database: {
        port: 5432,
      },
      jwt: {
        secret: 'default-secret',
        expiresIn: '15m',
        accessSecret: 'default-secret',
        accessExpiresIn: '15m',
        refreshSecret: 'default-secret',
        refreshExpiresIn: '30d',
      },
      cookies: {
        secure: false,
        sameSite: 'lax',
        path: '/',
        accessTokenName: 'access_token',
        refreshTokenName: 'refresh_token',
      },
      swagger: {
        enabled: true,
        path: 'docs',
      },
      security: {
        bcryptSaltRounds: 10,
        rateLimitTtl: 60,
        rateLimitLimit: 100,
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'authforge:',
      },
      nodemailer: {
        port: 587,
      },
    });
  });

  it('maps nodemailer environment variables to config', () => {
    process.env = {
      ...originalEnv,
      NODEMAILER_SMTP_HOST: 'smtp.example.com',
      NODEMAILER_SMTP_PORT: '465',
      NODEMAILER_SMTP_USER: 'smtp-user',
      NODEMAILER_SMTP_PASS: 'smtp-pass',
      NODEMAILER_MAIL_FROM: 'no-reply@example.com',
    };

    expect(configuration().nodemailer).toEqual({
      host: 'smtp.example.com',
      port: 465,
      user: 'smtp-user',
      pass: 'smtp-pass',
      from: 'no-reply@example.com',
    });
  });

  it('maps sendgrid environment variables to config', () => {
    process.env = {
      ...originalEnv,
      SENDGRID_API_KEY: 'SG.test-key',
      SENDGRID_MAIL_FROM: 'no-reply@sendgrid.example.com',
    };

    expect(configuration().sendgrid).toEqual({
      apiKey: 'SG.test-key',
      from: 'no-reply@sendgrid.example.com',
    });
  });
});
