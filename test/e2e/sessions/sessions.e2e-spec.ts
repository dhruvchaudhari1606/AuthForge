import {
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { SessionsController } from '../../../src/modules/sessions/sessions.controller';
import { SessionService } from '../../../src/modules/auth/sessions/session.service';
import { TokenService } from '../../../src/modules/auth/tokens/token.service';
import { CookieService } from '../../../src/modules/auth/cookies/cookie.service';
import { AuditService } from '../../../src/modules/audit/audit.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { LoggerService } from '@common/logger/logger.service';
import { createE2eApp } from '../setup/create-e2e-app';

type RequestWithUser = {
  user?: { userId: string; email: string; role: string };
};

describe('Sessions routes (e2e)', () => {
  let app: INestApplication;

  const sessionServiceMock = {
    findActiveSessionsByUserId: jest.fn(),
    revokeSessionForUser: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    revokeOtherUserSessions: jest.fn(),
  };

  const tokenServiceMock = {
    verifyRefreshToken: jest.fn(),
  };

  const mockConfigValues: Record<string, unknown> = {
    'app.env': 'development',
    'cookies.accessTokenName': 'access_token',
    'cookies.refreshTokenName': 'refresh_token',
    'cookies.sameSite': 'lax',
    'cookies.secure': false,
    'cookies.path': '/',
  };

  const configServiceMock = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      return mockConfigValues[key] !== undefined
        ? mockConfigValues[key]
        : (defaultValue ?? 'development');
    }),
  };

  const auditServiceMock = {
    log: jest.fn().mockResolvedValue(null),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      req.user = { userId: 'user-1', email: 'john@example.com', role: 'user' };
      return true;
    }),
  };

  const testLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        controllers: [SessionsController],
        providers: [
          { provide: SessionService, useValue: sessionServiceMock },
          { provide: TokenService, useValue: tokenServiceMock },
          { provide: ConfigService, useValue: configServiceMock },
          { provide: AuditService, useValue: auditServiceMock },
          { provide: LoggerService, useValue: testLogger },
          CookieService,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(jwtAuthGuardMock),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/sessions', () => {
    it('returns active sessions and marks current session when matching refresh cookie', async () => {
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';
      sessionServiceMock.findActiveSessionsByUserId.mockResolvedValue([
        {
          id: sessionId,
          user_id: 'user-1',
          device_name: 'Desktop Chrome',
          device_type: 'desktop',
          browser: 'Chrome 120',
          os: 'Windows 11',
          ip_address: '127.0.0.1',
          last_active_at: new Date('2026-09-19T10:00:00Z'),
          createdAt: new Date('2026-09-19T09:00:00Z'),
          expires_at: new Date('2026-10-19T09:00:00Z'),
        },
      ]);

      tokenServiceMock.verifyRefreshToken.mockResolvedValue({
        sub: 'user-1',
        sessionId,
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/sessions')
        .set('Cookie', ['refresh_token=valid-cookie-token'])
        .expect(200);

      expect(
        sessionServiceMock.findActiveSessionsByUserId,
      ).toHaveBeenCalledWith('user-1');

      const responseData = (
        response.body as {
          data: Array<{
            id: string;
            deviceName: string;
            current: boolean;
            refresh_token_hash?: string;
          }>;
        }
      ).data;

      expect(responseData).toHaveLength(1);
      expect(responseData[0]).toMatchObject({
        id: sessionId,
        deviceName: 'Desktop Chrome',
        current: true,
      });
      expect(responseData[0].refresh_token_hash).toBeUndefined();
    });
  });

  describe('DELETE /api/v1/sessions/:id', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174001';

    it('revokes the session successfully', async () => {
      sessionServiceMock.revokeSessionForUser.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/sessions/${validUuid}`)
        .expect(200);

      expect(sessionServiceMock.revokeSessionForUser).toHaveBeenCalledWith(
        validUuid,
        'user-1',
      );
      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Session revoked successfully' },
      });
    });

    it('returns 404 when session not found', async () => {
      sessionServiceMock.revokeSessionForUser.mockRejectedValue(
        new NotFoundException('Session not found'),
      );

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/sessions/${validUuid}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 404,
        message: 'Session not found',
      });
    });

    it('returns 403 when session belongs to another user', async () => {
      sessionServiceMock.revokeSessionForUser.mockRejectedValue(
        new ForbiddenException('You are not authorized to revoke this session'),
      );

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/sessions/${validUuid}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 403,
        message: 'You are not authorized to revoke this session',
      });
    });
  });

  describe('DELETE /api/v1/sessions', () => {
    it('revokes all sessions for user and clears auth cookies', async () => {
      sessionServiceMock.revokeAllUserSessions.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/sessions')
        .expect(200);

      expect(sessionServiceMock.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'All sessions revoked successfully' },
      });

      const cookies = response.headers['set-cookie'] as unknown as string[];
      expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
    });

    it('revokes other sessions when keepCurrent=true', async () => {
      const currentSessionId = '123e4567-e89b-12d3-a456-426614174099';
      tokenServiceMock.verifyRefreshToken.mockResolvedValue({
        sub: 'user-1',
        sessionId: currentSessionId,
      });
      sessionServiceMock.revokeOtherUserSessions.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .delete('/api/v1/sessions?keepCurrent=true')
        .set('Cookie', ['refresh_token=active-token'])
        .expect(200);

      expect(sessionServiceMock.revokeOtherUserSessions).toHaveBeenCalledWith(
        'user-1',
        currentSessionId,
      );
      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'All other sessions revoked successfully' },
      });
    });
  });
});
