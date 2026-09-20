import Joi from 'joi';

export const envValidationSchema: Joi.ObjectSchema<Record<string, unknown>> =
  Joi.object<Record<string, unknown>>({
    // APP
    APP_PORT: Joi.number().port().default(3000),
    APP_ENV: Joi.string()
      .valid('development', 'staging', 'production', 'test')
      .default('development'),

    // CORS
    CORS_ORIGIN: Joi.string().default('http://localhost:3001'),

    // DATABASE
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().port().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').default(''),
    DB_NAME: Joi.string().required(),

    // REDIS
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().port().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    REDIS_DB: Joi.number().integer().min(0).default(0),
    REDIS_KEY_PREFIX: Joi.string().allow('').default('authforge:'),

    // JWT
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('15m'),
    JWT_ACCESS_SECRET: Joi.string().allow('').optional(),
    JWT_ACCESS_EXPIRES_IN: Joi.string().allow('').optional(),
    JWT_REFRESH_SECRET: Joi.string().allow('').optional(),
    JWT_REFRESH_EXPIRES_IN: Joi.string().allow('').optional(),

    // COOKIES
    COOKIE_SECURE: Joi.boolean().optional(),
    COOKIE_SAME_SITE: Joi.string()
      .valid('lax', 'strict', 'none')
      .default('lax'),
    COOKIE_DOMAIN: Joi.string().allow('').optional(),
    COOKIE_PATH: Joi.string().default('/'),
    COOKIE_ACCESS_NAME: Joi.string().default('access_token'),
    COOKIE_REFRESH_NAME: Joi.string().default('refresh_token'),

    // SWAGGER & SENTRY
    SWAGGER_ENABLED: Joi.boolean().default(true),
    SWAGGER_PATH: Joi.string().default('docs'),
    SENTRY_DSN: Joi.string().allow('').optional(),

    // SECURITY
    BCRYPT_SALT_ROUNDS: Joi.number().integer().min(4).max(16).default(10),
    RATE_LIMIT_TTL: Joi.number().integer().positive().default(60),
    RATE_LIMIT_MAX: Joi.number().integer().positive().default(100),

    // MAIL
    MAIL_PROVIDER: Joi.string().valid('nodemailer', 'sendgrid').optional(),
    NODEMAILER_SMTP_HOST: Joi.string().allow('').optional(),
    NODEMAILER_SMTP_PORT: Joi.number().port().default(587),
    NODEMAILER_SMTP_USER: Joi.string().allow('').optional(),
    NODEMAILER_SMTP_PASS: Joi.string().allow('').optional(),
    NODEMAILER_MAIL_FROM: Joi.string().allow('').optional(),

    SENDGRID_API_KEY: Joi.string().allow('').optional(),
    SENDGRID_MAIL_FROM: Joi.string().allow('').optional(),
  }).unknown(true);

export const validateEnv = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const { error, value } = envValidationSchema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    throw error;
  }

  return value;
};
