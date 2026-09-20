import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '@modules/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

import { LoggerService } from '@common/logger/logger.service';
import { SessionService } from './sessions/session.service';
import { TokenService } from './tokens/token.service';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionCleanupService } from './sessions/session-cleanup.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '@database/entities/session.entity';
import { getJwtModuleConfig } from '@config/jwt.config';

import { PasswordService } from './password/password.service';
import { CookieService } from './cookies/cookie.service';

@Module({
  imports: [
    UsersModule,

    TypeOrmModule.forFeature([Session]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getJwtModuleConfig(configService),
    }),

    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LoggerService,
    SessionService,
    TokenService,
    SessionCleanupService,
    PasswordService,
    CookieService,
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordService,
    CookieService,
    SessionService,
  ],
})
export class AuthModule {}
