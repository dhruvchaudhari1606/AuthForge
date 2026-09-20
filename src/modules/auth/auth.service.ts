import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { UsersService } from '@modules/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoggerService } from '@common/logger/logger.service';
import { SessionService } from './sessions/session.service';
import { TokenService } from './tokens/token.service';
import { PasswordService } from './password/password.service';
import { AuditService } from '@modules/audit/audit.service';
import { Request } from 'express';
import { getDeviceInfo } from '@common/utils/device.util';
import { AuditEvent, UserStatus } from '@common/constants/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  private getRefreshExpirationDate(): Date {
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '30d';
    const refreshTtlMs =
      typeof ms === 'function'
        ? (ms(refreshExpiresIn as StringValue) ?? 30 * 24 * 60 * 60 * 1000)
        : 30 * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + refreshTtlMs);
  }

  async register(registerDetails: RegisterDto) {
    try {
      const existingUser = await this.usersService.findByEmail(
        registerDetails.email,
      );

      if (existingUser) {
        this.logger.warn(
          `User already exists: ${registerDetails.email}`,
          AuthService.name,
        );
        throw new ConflictException('User already exists');
      }

      const user = await this.usersService.createUser(registerDetails);

      await this.auditService.log({
        userId: user.id,
        event: AuditEvent.AUTH_REGISTER,
        metadata: { email: registerDetails.email },
      });

      return user;
    } catch (error) {
      this.logger.error(
        `Registration failed for ${registerDetails.email}`,
        error instanceof Error ? error.stack : String(error),
        AuthService.name,
      );
      throw error;
    }
  }

  async login(loginDto: LoginDto, req: Request) {
    try {
      this.logger.log('Login attempt', AuthService.name);
      const user = await this.usersService.findByEmail(loginDto.email);

      if (!user) {
        await this.auditService.log({
          event: AuditEvent.AUTH_LOGIN_FAILURE,
          metadata: { email: loginDto.email, reason: 'user_not_found' },
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      if (
        user.status === UserStatus.LOCKED ||
        user.status === UserStatus.DISABLED
      ) {
        await this.auditService.log({
          userId: user.id,
          event: AuditEvent.AUTH_LOGIN_FAILURE,
          metadata: { email: loginDto.email, status: user.status },
        });
        throw new UnauthorizedException(`Account is ${user.status}`);
      }

      const isPasswordValid = await this.passwordService.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        await this.auditService.log({
          userId: user.id,
          event: AuditEvent.AUTH_LOGIN_FAILURE,
          metadata: { email: loginDto.email, reason: 'invalid_password' },
        });
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = this.tokenService.generateAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role?.name || 'user',
        tokenVersion: user.token_version,
      });

      // Extract device info from user-agent
      const userAgent = (req.headers?.['user-agent'] as string) || '';
      const deviceInfo = getDeviceInfo(userAgent);

      const ipAddress = req.ips?.length ? req.ips[0] : req.ip;

      const expiresAt = this.getRefreshExpirationDate();

      const sessionDetails = await this.sessionService.createSession({
        user_id: user.id,
        ...deviceInfo,
        ip_address: ipAddress,
        expires_at: expiresAt,
        last_active_at: new Date(),
      });

      const refreshToken = this.tokenService.generateRefreshToken({
        sub: user.id,
        sessionId: sessionDetails.id,
        tokenVersion: user.token_version,
      });

      const refreshTokenHash =
        await this.tokenService.hashRefreshToken(refreshToken);

      await this.sessionService.updateSessionToken(
        sessionDetails.id,
        refreshTokenHash,
        expiresAt,
      );

      await this.usersService.updateLastLogin(user.id);

      await this.auditService.log({
        userId: user.id,
        event: AuditEvent.AUTH_LOGIN_SUCCESS,
        ipAddress,
        userAgent,
        metadata: { sessionId: sessionDetails.id },
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(
        `Login failed for ${loginDto.email}`,
        error instanceof Error ? error.stack : String(error),
        AuthService.name,
      );
      throw error;
    }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      const { sub: userId, sessionId, tokenVersion } = payload;

      const userDetails = await this.usersService.findById(userId);

      if (!userDetails) {
        throw new UnauthorizedException('User not found');
      }

      if (
        userDetails.status === UserStatus.LOCKED ||
        userDetails.status === UserStatus.DISABLED
      ) {
        throw new UnauthorizedException(`Account is ${userDetails.status}`);
      }

      if (userDetails.token_version !== tokenVersion) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const newAccessToken = this.tokenService.generateAccessToken({
        sub: userId,
        email: userDetails.email,
        role: userDetails.role?.name || 'user',
        tokenVersion: userDetails.token_version,
      });

      const newRefreshToken = this.tokenService.generateRefreshToken({
        sub: userId,
        sessionId,
        tokenVersion: userDetails.token_version,
      });

      const newHash = await this.tokenService.hashRefreshToken(newRefreshToken);

      const expiresAt = this.getRefreshExpirationDate();

      // Concurrency-protected pessimistic locking rotation
      try {
        await this.sessionService.rotateSessionToken(
          sessionId,
          refreshToken,
          newHash,
          expiresAt,
        );
      } catch (rotationError) {
        if (
          rotationError instanceof UnauthorizedException &&
          rotationError.message === 'Refresh token reuse detected'
        ) {
          await this.auditService.log({
            userId,
            event: AuditEvent.AUTH_REFRESH_REUSE_DETECTED,
            metadata: { sessionId },
          });
        }
        throw rotationError;
      }

      await this.auditService.log({
        userId,
        event: AuditEvent.AUTH_REFRESH,
        metadata: { sessionId },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(
        'Token refresh failed',
        error instanceof Error ? error.stack : String(error),
        AuthService.name,
      );
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);

      const { sub: userId, sessionId } = payload;

      await this.sessionService.revokeSession(sessionId);

      await this.auditService.log({
        userId,
        event: AuditEvent.AUTH_LOGOUT,
        metadata: { sessionId },
      });
    } catch (error) {
      this.logger.error(
        'Logout failed',
        error instanceof Error ? error.stack : String(error),
        AuthService.name,
      );
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.revokeAllUserSessions(userId);
    await this.usersService.incrementTokenVersion(userId);

    await this.auditService.log({
      userId,
      event: AuditEvent.AUTH_LOGOUT_ALL,
    });
  }
}
