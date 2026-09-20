import { SessionsController } from './sessions.controller';
import { SessionService } from '@modules/auth/sessions/session.service';
import { TokenService } from '@modules/auth/tokens/token.service';
import { CookieService } from '@modules/auth/cookies/cookie.service';
import { AuditService } from '@modules/audit/audit.service';
import { Request, Response } from 'express';
import { ROLES, AuditEvent } from '@common/constants/constants';
import { Session } from '@database/entities/session.entity';

describe('SessionsController', () => {
  let controller: SessionsController;

  const sessionService = {
    findActiveSessionsByUserId: jest.fn(),
    revokeSessionForUser: jest.fn(),
    revokeAllUserSessions: jest.fn(),
    revokeOtherUserSessions: jest.fn(),
  } as unknown as SessionService;

  const tokenService = {
    verifyRefreshToken: jest.fn(),
  } as unknown as TokenService;

  const cookieService = {
    extractRefreshToken: jest.fn(),
    clearAuthCookies: jest.fn(),
  } as unknown as CookieService;

  const auditService = {
    log: jest.fn(),
  } as unknown as AuditService;

  const mockUser = {
    userId: 'user-1',
    email: 'user@example.com',
    role: ROLES.USER,
  };

  const mockReq = {} as Request;
  const mockRes = {} as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SessionsController(
      sessionService,
      tokenService,
      cookieService,
      auditService,
    );
  });

  describe('getActiveSessions', () => {
    it('returns active sessions with current flag true for active token', async () => {
      const sessions = [
        {
          id: 'session-1',
          user_id: 'user-1',
          device_name: 'Chrome on Mac',
          device_type: 'desktop',
          browser: 'Chrome',
          os: 'macOS',
          ip_address: '1.2.3.4',
          last_active_at: new Date('2026-09-01'),
          createdAt: new Date('2026-08-01'),
          expires_at: new Date('2026-10-01'),
        },
        {
          id: 'session-2',
          user_id: 'user-1',
          device_name: 'Safari on iPhone',
          device_type: 'mobile',
          browser: 'Safari',
          os: 'iOS',
          ip_address: '1.2.3.5',
          last_active_at: new Date('2026-08-15'),
          createdAt: new Date('2026-08-01'),
          expires_at: new Date('2026-10-01'),
        },
      ] as unknown as Session[];

      (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(
        'mock-refresh-token',
      );
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sessionId: 'session-1',
      });
      (
        sessionService.findActiveSessionsByUserId as jest.Mock
      ).mockResolvedValue(sessions);

      const result = await controller.getActiveSessions(mockUser, mockReq);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[0].current).toBe(true);
      expect(result[1].id).toBe('session-2');
      expect(result[1].current).toBe(false);
      // Ensure refresh_token_hash is never exposed
      expect(
        (result[0] as unknown as Record<string, unknown>).refresh_token_hash,
      ).toBeUndefined();
    });
  });

  describe('revokeSession', () => {
    it('revokes the session and clears cookies if current session', async () => {
      (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(
        'token-1',
      );
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sessionId: 'session-1',
      });
      (sessionService.revokeSessionForUser as jest.Mock).mockResolvedValue(
        undefined,
      );

      const res = await controller.revokeSession(
        'session-1',
        mockUser,
        mockReq,
        mockRes,
      );

      expect(sessionService.revokeSessionForUser).toHaveBeenCalledWith(
        'session-1',
        'user-1',
      );
      expect(cookieService.clearAuthCookies).toHaveBeenCalledWith(mockRes);
      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        event: AuditEvent.SESSION_REVOKED,
        metadata: { sessionId: 'session-1' },
      });
      expect(res).toEqual({ message: 'Session revoked successfully' });
    });

    it('revokes the session without clearing cookies if not current session', async () => {
      (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(
        'token-1',
      );
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sessionId: 'session-2',
      });
      (sessionService.revokeSessionForUser as jest.Mock).mockResolvedValue(
        undefined,
      );

      await controller.revokeSession('session-1', mockUser, mockReq, mockRes);

      expect(sessionService.revokeSessionForUser).toHaveBeenCalledWith(
        'session-1',
        'user-1',
      );
      expect(cookieService.clearAuthCookies).not.toHaveBeenCalled();
    });
  });

  describe('revokeAllSessions', () => {
    it('revokes all sessions and clears cookies when keepCurrent is not set', async () => {
      (sessionService.revokeAllUserSessions as jest.Mock).mockResolvedValue(
        undefined,
      );

      const res = await controller.revokeAllSessions(
        mockUser,
        mockReq,
        mockRes,
      );

      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(cookieService.clearAuthCookies).toHaveBeenCalledWith(mockRes);
      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        event: AuditEvent.SESSION_REVOKED_ALL,
        metadata: { keepCurrent: false },
      });
      expect(res).toEqual({ message: 'All sessions revoked successfully' });
    });

    it('revokes other sessions and retains cookies when keepCurrent=true', async () => {
      (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(
        'token-1',
      );
      (tokenService.verifyRefreshToken as jest.Mock).mockResolvedValue({
        sessionId: 'session-current',
      });
      (sessionService.revokeOtherUserSessions as jest.Mock).mockResolvedValue(
        undefined,
      );

      const res = await controller.revokeAllSessions(
        mockUser,
        mockReq,
        mockRes,
        'true',
      );

      expect(sessionService.revokeOtherUserSessions).toHaveBeenCalledWith(
        'user-1',
        'session-current',
      );
      expect(cookieService.clearAuthCookies).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith({
        userId: 'user-1',
        event: AuditEvent.SESSION_REVOKED_ALL,
        metadata: { keepCurrent: true, currentSessionId: 'session-current' },
      });
      expect(res).toEqual({
        message: 'All other sessions revoked successfully',
      });
    });
  });
});
