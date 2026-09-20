import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('AuthForge API')
  .setDescription(
    'AuthForge — Standalone, Production-Grade Authentication & Identity Backend Service.\n\n' +
      '### Architecture Highlights\n' +
      '- **Cookie-Based Authentication**: Primary browser transport uses HttpOnly, Secure, SameSite cookies (`access_token` and `refresh_token`).\n' +
      '- **Bearer Token Fallback**: Supports `Authorization: Bearer <access_token>` for native, mobile, or external API clients.\n' +
      '- **Multi-Device Session Tracking**: PostgreSQL-backed sessions with pessimistic row locking (`SELECT ... FOR UPDATE`), rotation, and token reuse detection.\n' +
      '- **Role-Based Access Control (RBAC)**: Granular permission checking with `@RequirePermissions(...)`.\n' +
      '- **Security**: Helmet security headers, CORS origin enforcement, rate limiting, and email enumeration defense.',
  )
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Optional JWT Bearer access token fallback',
    },
    'bearer',
  )
  .addCookieAuth('access_token', {
    type: 'apiKey',
    in: 'cookie',
    name: 'access_token',
    description: 'HttpOnly cookie containing JWT access token',
  })
  .addCookieAuth('refresh_token', {
    type: 'apiKey',
    in: 'cookie',
    name: 'refresh_token',
    description: 'HttpOnly cookie containing rotating refresh token',
  })
  .addTag(
    'Auth',
    'Authentication, Registration, Token Rotation & Password Recovery',
  )
  .addTag('Sessions', 'Multi-device Session Management & Revocation')
  .addTag('Users', 'User Profile & Identity')
  .addTag('Authorization', 'Role Management & Dynamic Permission Assignment')
  .addTag('Health', 'Service Health & Infrastructure Monitoring')
  .build();
