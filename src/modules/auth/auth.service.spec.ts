import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { LoggerService } from '@common/logger/logger.service';
import { UsersService } from '@modules/users/users.service';
import { SessionService } from './sessions/session.service';
import { TokenService } from './tokens/token.service';
import { PasswordService } from './password/password.service';
import { AuthService } from './auth.service';
import { AuditEvent, UserStatus } from '@common/constants/constants';

import { AuditService } from '@modules/audit/audit.service';
import { EmailVerificationService } from '@modules/email-verification/email-verification.service';

describe('AuthService', () => {
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    createUser: jest.fn(),
    incrementTokenVersion: jest.fn(),
    updateLastLogin: jest.fn(),
  } as unknown as UsersService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const logger = {
    warn: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  } as unknown as LoggerService;

  const sessionService = {
    createSession: jest.fn(),
    updateSessionToken: jest.fn(),
    validateSession: jest.fn(),
    rotateSessionToken: jest.fn(),
    deleteSession: jest.fn(),
    deleteAllUserSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllUserSessions: jest.fn(),
  } as unknown as SessionService;

  const tokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
    hashRefreshToken: jest.fn(),
  } as unknown as TokenService;

  const mockReq = {
    headers: { 'user-agent': 'test-agent' },
    ips: [],
    ip: '127.0.0.1',
  } as unknown as Request;

  const passwordService = {
    hash: jest.fn(),
    compare: jest.fn(),
    validateStrength: jest.fn(),
  } as unknown as PasswordService;

  const auditService = {
    log: jest.fn(),
    findByUserId: jest.fn(),
  } as unknown as AuditService;

  const emailVerificationService = {
    sendVerification: jest.fn(),
  } as unknown as EmailVerificationService;

  const configService = {
    get: jest.fn().mockReturnValue('30d'),
  } as unknown as ConfigService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      usersService,
      jwtService,
      logger,
      sessionService,
      tokenService,
      passwordService,
      auditService,
      configService,
      emailVerificationService,
    );
  });

  it('rejects registration when email already exists', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'existing',
    });

    await expect(
      service.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        language: 'en',
      }),
    ).rejects.toThrow(ConflictException);

    expect(logger.warn).toHaveBeenCalledWith(
      'User already exists: john@example.com',
      AuthService.name,
    );
    expect(usersService.createUser).not.toHaveBeenCalled();
  });

  it('creates a new user when registration data is valid', async () => {
    const createdUser = { id: 'user-1', email: 'john@example.com' };

    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
    (usersService.createUser as jest.Mock).mockResolvedValue(createdUser);

    await expect(
      service.register({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        language: 'en',
      }),
    ).resolves.toEqual(createdUser);

    expect(usersService.createUser).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      language: 'en',
    });
    expect(emailVerificationService.sendVerification).toHaveBeenCalledWith(
      createdUser,
    );
  });

  it('rejects login when user does not exist', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login(
        { email: 'john@example.com', password: 'password123' },
        mockReq,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rejects login when account is pending email verification', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed',
      status: UserStatus.PENDING_VERIFICATION,
    });

    await expect(
      service.login(
        { email: 'john@example.com', password: 'password123' },
        mockReq,
      ),
    ).rejects.toThrow(
      new UnauthorizedException('Please verify your email before logging in'),
    );
  });

  it('rejects login when password comparison fails', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed',
      role: { name: 'user' },
      status: UserStatus.ACTIVE,
    });
    (passwordService.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login(
        { email: 'john@example.com', password: 'wrong-password' },
        mockReq,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
  });

  it('rejects login when account is locked or disabled', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed',
      status: UserStatus.LOCKED,
    });

    await expect(
      service.login(
        { email: 'john@example.com', password: 'password123' },
        mockReq,
      ),
    ).rejects.toThrow(new UnauthorizedException('Account is locked'));
  });

  it('returns an access token when login succeeds', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      password: 'hashed-password',
      role: { name: 'admin' },
      status: UserStatus.ACTIVE,
    });
    (passwordService.compare as jest.Mock).mockResolvedValue(true);
    (tokenService.generateAccessToken as jest.Mock).mockReturnValue(
      'jwt-token',
    );
    (sessionService.createSession as jest.Mock).mockResolvedValue({
      id: 'session-1',
    });
    (tokenService.generateRefreshToken as jest.Mock).mockReturnValue(
      'refresh-token',
    );
    (tokenService.hashRefreshToken as jest.Mock).mockResolvedValue(
      'hashed-refresh',
    );
    (sessionService.updateSessionToken as jest.Mock).mockResolvedValue(
      undefined,
    );
    (usersService.updateLastLogin as jest.Mock) = jest
      .fn()
      .mockResolvedValue(undefined);

    await expect(
      service.login(
        { email: 'john@example.com', password: 'password123' },
        mockReq,
      ),
    ).resolves.toEqual({
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token',
    });

    expect(logger.log).toHaveBeenCalledWith('Login attempt', AuthService.name);
    expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'john@example.com',
      role: 'admin',
    });
  });

  describe('refresh', () => {
    it('returns new tokens when refresh token and session are valid', async () => {
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        sessionId: 'session-1',
      });
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        role: { name: 'user' },
        status: UserStatus.ACTIVE,
      });
      (sessionService.rotateSessionToken as jest.Mock).mockResolvedValue({
        id: 'session-1',
      });
      (tokenService.generateAccessToken as jest.Mock).mockReturnValue(
        'new-access-token',
      );
      (tokenService.generateRefreshToken as jest.Mock).mockReturnValue(
        'new-refresh-token',
      );
      (tokenService.hashRefreshToken as jest.Mock).mockResolvedValue(
        'new-hash',
      );

      await expect(service.refresh('old-refresh-token')).resolves.toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
      );
      expect(sessionService.rotateSessionToken).toHaveBeenCalledWith(
        'session-1',
        'old-refresh-token',
        'new-hash',
        expect.any(Date),
      );
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'john@example.com',
        role: 'user',
      });
    });

    it('throws when user is not found during refresh', async () => {
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sub: 'ghost-user',
        sessionId: 'session-1',
      });
      (usersService.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('re-throws when token verification fails', async () => {
      (tokenService.verifyRefreshToken as jest.Mock).mockRejectedValue(
        new Error('invalid token'),
      );

      await expect(service.refresh('bad-token')).rejects.toThrow(
        'invalid token',
      );
    });

    it('triggers account-wide session revocation and bumps token_version on reuse detection', async () => {
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        sessionId: 'session-1',
        tokenVersion: 3,
      });
      (usersService.findById as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        roles: [{ name: 'user' }],
        status: UserStatus.ACTIVE,
        token_version: 3,
      });
      (sessionService.rotateSessionToken as jest.Mock).mockRejectedValue(
        new UnauthorizedException('Refresh token reuse detected'),
      );

      await expect(service.refresh('reused-token')).rejects.toThrow(
        new UnauthorizedException('Refresh token reuse detected'),
      );

      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith('user-1');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          event: AuditEvent.AUTH_REFRESH_REUSE_DETECTED,
          metadata: { sessionId: 'session-1' },
        }),
      );
    });
  });

  describe('logout', () => {
    it('revokes the session identified by the refresh token', async () => {
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        sessionId: 'session-1',
      });
      (sessionService.revokeSession as jest.Mock).mockResolvedValue(undefined);

      await service.logout('valid-refresh-token');

      expect(sessionService.revokeSession).toHaveBeenCalledWith('session-1');
    });

    it('silently handles invalid refresh token without throwing', async () => {
      (tokenService.verifyRefreshToken as jest.Mock).mockRejectedValue(
        new Error('jwt expired'),
      );

      await expect(service.logout('expired-token')).resolves.toBeUndefined();
      expect(sessionService.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('revokes all sessions for the given user', async () => {
      (sessionService.revokeAllUserSessions as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.logoutAll('user-1');

      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(usersService.incrementTokenVersion).toHaveBeenCalledWith('user-1');
    });
  });
});
