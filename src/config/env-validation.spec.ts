import { validateEnv } from './env-validation';

describe('env-validation', () => {
  const validBaseEnv = {
    DB_HOST: 'localhost',
    DB_USER: 'postgres',
    DB_NAME: 'authforge',
    JWT_SECRET: 'super-secret-key-12345',
  };

  it('validates and applies defaults for minimal valid configuration', () => {
    const validated = validateEnv(validBaseEnv);

    expect(validated).toMatchObject({
      APP_PORT: 3000,
      APP_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:3001',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USER: 'postgres',
      DB_NAME: 'authforge',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      JWT_SECRET: 'super-secret-key-12345',
      JWT_EXPIRES_IN: '15m',
      COOKIE_SAME_SITE: 'lax',
      COOKIE_PATH: '/',
      COOKIE_ACCESS_NAME: 'access_token',
      COOKIE_REFRESH_NAME: 'refresh_token',
      SWAGGER_ENABLED: true,
      SWAGGER_PATH: 'docs',
      BCRYPT_SALT_ROUNDS: 10,
      RATE_LIMIT_TTL: 60,
      RATE_LIMIT_MAX: 100,
    });
  });

  it('throws an error when required DB_HOST is missing', () => {
    const invalidEnv = { ...validBaseEnv };
    delete (invalidEnv as Record<string, unknown>).DB_HOST;

    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  it('throws an error when required JWT_SECRET is missing', () => {
    const invalidEnv = { ...validBaseEnv };
    delete (invalidEnv as Record<string, unknown>).JWT_SECRET;

    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  it('throws an error when APP_ENV has an invalid value', () => {
    const invalidEnv = { ...validBaseEnv, APP_ENV: 'invalid_env' };

    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  it('throws an error when COOKIE_SAME_SITE has an invalid value', () => {
    const invalidEnv = {
      ...validBaseEnv,
      COOKIE_SAME_SITE: 'invalid_samesite',
    };

    expect(() => validateEnv(invalidEnv)).toThrow();
  });

  it('accepts valid custom configuration values', () => {
    const customEnv = {
      ...validBaseEnv,
      APP_PORT: 4000,
      APP_ENV: 'production',
      CORS_ORIGIN: 'https://authforge.example.com',
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_ACCESS_EXPIRES_IN: '10m',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '60d',
      COOKIE_SECURE: true,
      COOKIE_SAME_SITE: 'strict',
      REDIS_DB: 3,
      REDIS_KEY_PREFIX: 'custom:',
    };

    const validated = validateEnv(customEnv);

    expect(validated).toMatchObject({
      APP_PORT: 4000,
      APP_ENV: 'production',
      CORS_ORIGIN: 'https://authforge.example.com',
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_ACCESS_EXPIRES_IN: '10m',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_REFRESH_EXPIRES_IN: '60d',
      COOKIE_SECURE: true,
      COOKIE_SAME_SITE: 'strict',
      REDIS_DB: 3,
      REDIS_KEY_PREFIX: 'custom:',
    });
  });
});
