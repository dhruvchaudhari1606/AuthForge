import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configuration from '@config/configuration';
import { getDatabaseConfig } from '@config/database.config';
import { validateEnv } from '@config/env-validation';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ThrottlerModule } from '@nestjs/throttler';

import { APP_GUARD } from '@nestjs/core';
import { LoggerService } from '@common/logger/logger.service';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from '@modules/mail/mail.module';
import { ThrottlerBehindProxyGuard } from '@common/guards/throttler-behind-proxy.guard';
import { PasswordResetModule } from '@modules/password-reset/password-reset.module';
import { AuditModule } from '@modules/audit/audit.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { EmailVerificationModule } from '@modules/email-verification/email-verification.module';
import { AuthorizationModule } from '@modules/authorization/authorization.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validate: validateEnv,
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl:
              (configService.get<number>('security.rateLimitTtl') ?? 60) * 1000,
            limit: configService.get<number>('security.rateLimitLimit') ?? 100,
          },
        ],
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getDatabaseConfig(configService),
    }),

    AuditModule,
    AuthModule,
    AuthorizationModule,
    SessionsModule,
    UsersModule,
    HealthModule,
    MailModule,
    PasswordResetModule,
    EmailVerificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    LoggerService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('{*path}');
  }
}
