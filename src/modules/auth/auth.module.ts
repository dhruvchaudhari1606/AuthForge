import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { UsersModule } from '@modules/users/users.module';
import { SessionsModule } from '@modules/sessions/sessions.module';
import { JwtStrategy } from './strategies/jwt.strategy';

import { LoggerService } from '@common/logger/logger.service';
import { TokenService } from './tokens/token.service';
import { getJwtModuleConfig } from '@config/jwt.config';

import { PasswordService } from './password/password.service';
import { CookieService } from './cookies/cookie.service';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => SessionsModule),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getJwtModuleConfig(configService),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LoggerService,
    TokenService,
    PasswordService,
    CookieService,
  ],
  exports: [
    AuthService,
    TokenService,
    PasswordService,
    CookieService,
    SessionsModule,
  ],
})
export class AuthModule {}
