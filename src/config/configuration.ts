export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    env: process.env.APP_ENV || 'development',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'authforge:',
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    accessExpiresIn:
      process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  cookies: {
    secure:
      process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === 'true'
        : process.env.APP_ENV === 'production',
    sameSite: (process.env.COOKIE_SAME_SITE || 'lax') as
      | 'lax'
      | 'strict'
      | 'none',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: process.env.COOKIE_PATH || '/',
    accessTokenName: process.env.COOKIE_ACCESS_NAME || 'access_token',
    refreshTokenName: process.env.COOKIE_REFRESH_NAME || 'refresh_token',
  },

  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    title: 'AuthForge API',
    description:
      'AuthForge — Authentication & Identity Service API documentation',
    version: '1.0',
    path: process.env.SWAGGER_PATH || 'docs',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
  },

  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    rateLimitLimit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  mail: {
    provider:
      process.env.MAIL_PROVIDER ||
      (process.env.SENDGRID_API_KEY ? 'sendgrid' : 'nodemailer'),
  },

  nodemailer: {
    host: process.env.NODEMAILER_SMTP_HOST,
    port: parseInt(process.env.NODEMAILER_SMTP_PORT || '587', 10),
    user: process.env.NODEMAILER_SMTP_USER,
    pass: process.env.NODEMAILER_SMTP_PASS,
    from: process.env.NODEMAILER_MAIL_FROM,
  },

  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: process.env.SENDGRID_MAIL_FROM,
  },
});
