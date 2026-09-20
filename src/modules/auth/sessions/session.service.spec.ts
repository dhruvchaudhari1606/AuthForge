import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Session } from '@database/entities/session.entity';
import { SessionService } from './session.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

interface MockQueryBuilder {
  update: jest.Mock;
  set: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  execute: jest.Mock;
}

describe('SessionService', () => {
  let queryBuilder: MockQueryBuilder;
  let manager: {
    transaction: jest.Mock;
  };

  let sessionRepository: Partial<Repository<Session>>;

  const compareMock = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

  let service: SessionService;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    manager = {
      transaction: jest.fn(),
    };

    sessionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      manager: manager as never,
    };

    service = new SessionService(sessionRepository as Repository<Session>);
  });

  describe('createSession', () => {
    it('creates and saves a new session', async () => {
      const data = { user_id: 'user-1' } as Partial<Session>;
      const created = { id: 'session-1', user_id: 'user-1' } as Session;
      const saved = { id: 'session-1', user_id: 'user-1' } as Session;

      (sessionRepository.create as jest.Mock).mockReturnValue(created);
      (sessionRepository.save as jest.Mock).mockResolvedValue(saved);

      await expect(service.createSession(data)).resolves.toEqual(saved);
      expect(sessionRepository.create).toHaveBeenCalledWith(data);
      expect(sessionRepository.save).toHaveBeenCalledWith(created);
    });
  });

  describe('findSessionById', () => {
    it('returns a session when found', async () => {
      const session = { id: 'session-1' } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(session);

      await expect(service.findSessionById('session-1')).resolves.toEqual(
        session,
      );
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
    });

    it('returns null when session not found', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findSessionById('missing')).resolves.toBeNull();
    });
  });

  describe('findSessionByUserId', () => {
    it('returns all sessions belonging to a user', async () => {
      const sessions = [{ id: 'session-1' }, { id: 'session-2' }] as Session[];
      (sessionRepository.find as jest.Mock).mockResolvedValue(sessions);

      await expect(service.findSessionByUserId('user-1')).resolves.toEqual(
        sessions,
      );
      expect(sessionRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('returns empty array when user has no sessions', async () => {
      (sessionRepository.find as jest.Mock).mockResolvedValue([]);

      await expect(service.findSessionByUserId('user-1')).resolves.toEqual([]);
    });
  });

  describe('findActiveSessionsByUserId', () => {
    it('returns active unrevoked and unexpired sessions for a user', async () => {
      const sessions = [{ id: 'session-1' }] as Session[];
      (sessionRepository.find as jest.Mock).mockResolvedValue(sessions);

      const result = await service.findActiveSessionsByUserId('user-1');
      expect(result).toEqual(sessions);
      expect(sessionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user_id: 'user-1',
          }),
          order: { last_active_at: 'DESC' },
        }),
      );
    });
  });

  describe('updateSessionToken', () => {
    it('updates refresh_token_hash and expires_at on the session', async () => {
      (sessionRepository.update as jest.Mock).mockResolvedValue(undefined);
      const expiresAt = new Date('2030-01-01');

      await service.updateSessionToken('session-1', 'new-hash', expiresAt);

      expect(sessionRepository.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          refresh_token_hash: 'new-hash',
          expires_at: expiresAt,
          last_active_at: expect.any(Date),
        }),
      );
    });
  });

  describe('updateLastActive', () => {
    it('updates last_active_at on the session', async () => {
      (sessionRepository.update as jest.Mock).mockResolvedValue(undefined);

      await service.updateLastActive('session-1');

      expect(sessionRepository.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          last_active_at: expect.any(Date),
        }),
      );
    });
  });

  describe('deleteSession and deleteAllUserSessions', () => {
    it('deletes session by id', async () => {
      (sessionRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteSession('session-1');

      expect(sessionRepository.delete).toHaveBeenCalledWith('session-1');
    });

    it('deletes all sessions for a given user', async () => {
      (sessionRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteAllUserSessions('user-1');

      expect(sessionRepository.delete).toHaveBeenCalledWith({
        user_id: 'user-1',
      });
    });
  });

  describe('revokeSession, revokeSessionForUser, and revokeAllUserSessions', () => {
    it('sets revoked_at timestamp when revoking a session', async () => {
      (sessionRepository.update as jest.Mock).mockResolvedValue(undefined);

      await service.revokeSession('session-1');

      expect(sessionRepository.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          revoked_at: expect.any(Date),
        }),
      );
    });

    it('revokes all active sessions for a user', async () => {
      (sessionRepository.update as jest.Mock).mockResolvedValue(undefined);

      await service.revokeAllUserSessions('user-1');

      expect(sessionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1' }),
        expect.objectContaining({
          revoked_at: expect.any(Date),
        }),
      );
    });

    it('revokes a specific session for its owner', async () => {
      const session = {
        id: 'session-1',
        user_id: 'user-1',
      } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(session);
      (sessionRepository.save as jest.Mock).mockImplementation((s) =>
        Promise.resolve(s),
      );

      const revoked = await service.revokeSessionForUser('session-1', 'user-1');
      expect(revoked.revoked_at).toBeInstanceOf(Date);
      expect(sessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'session-1',
          revoked_at: expect.any(Date),
        }),
      );
    });

    it('throws NotFoundException when session is not found in revokeSessionForUser', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.revokeSessionForUser('missing', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when another user attempts to revoke the session', async () => {
      const session = {
        id: 'session-1',
        user_id: 'other-user',
      } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(session);

      await expect(
        service.revokeSessionForUser('session-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('revokes other sessions using queryBuilder', async () => {
      await service.revokeOtherUserSessions('user-1', 'current-session');
      expect(queryBuilder.where).toHaveBeenCalledWith('user_id = :userId', {
        userId: 'user-1',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'id != :currentSessionId',
        { currentSessionId: 'current-session' },
      );
      expect(queryBuilder.execute).toHaveBeenCalled();
    });
  });

  describe('compareTokenHash and validateSession', () => {
    it('matches sha256 token hash correctly', async () => {
      const rawToken = 'sample-refresh-token';
      const sha256Hash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const isMatch = await service.compareTokenHash(rawToken, sha256Hash);
      expect(isMatch).toBe(true);

      const isWrong = await service.compareTokenHash('wrong', sha256Hash);
      expect(isWrong).toBe(false);
    });

    it('matches bcrypt token hash when hash starts with $2b$', async () => {
      const bcryptHash = '$2b$10$abcdefghijklmnopqrstuvwxyz123456';
      compareMock.mockResolvedValue(true as never);

      const isMatch = await service.compareTokenHash('my-token', bcryptHash);
      expect(isMatch).toBe(true);
      expect(compareMock).toHaveBeenCalledWith('my-token', bcryptHash);
    });

    it('throws UnauthorizedException when session does not exist in validateSession', async () => {
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.validateSession('session-1', 'any-token'),
      ).rejects.toThrow(new UnauthorizedException('Session not found'));
    });

    it('throws UnauthorizedException when session is expired in validateSession', async () => {
      const expired = {
        id: 'session-1',
        expires_at: new Date('2020-01-01'),
        refresh_token_hash: 'hash',
      } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(expired);

      await expect(
        service.validateSession('session-1', 'any-token'),
      ).rejects.toThrow(new UnauthorizedException('Session expired'));
    });

    it('throws UnauthorizedException when session has been revoked in validateSession', async () => {
      const revoked = {
        id: 'session-1',
        expires_at: new Date(Date.now() + 86400000),
        refresh_token_hash: 'hash',
        revoked_at: new Date('2026-01-01'),
      } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(revoked);

      await expect(
        service.validateSession('session-1', 'any-token'),
      ).rejects.toThrow(new UnauthorizedException('Session has been revoked'));
    });

    it('throws UnauthorizedException and revokes session when token does not match (reuse detection)', async () => {
      const session = {
        id: 'session-1',
        expires_at: new Date(Date.now() + 86400000),
        refresh_token_hash: '$2b$10$hash',
      } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(session);
      compareMock.mockResolvedValue(false as never);

      await expect(
        service.validateSession('session-1', 'wrong-token'),
      ).rejects.toThrow(
        new UnauthorizedException('Refresh token reuse detected'),
      );

      expect(sessionRepository.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          revoked_at: expect.any(Date),
        }),
      );
    });

    it('returns session when token is valid in validateSession', async () => {
      const session = {
        id: 'session-1',
        expires_at: new Date(Date.now() + 86400000),
        refresh_token_hash: '$2b$10$hash',
      } as Session;
      (sessionRepository.findOne as jest.Mock).mockResolvedValue(session);
      compareMock.mockResolvedValue(true as never);

      await expect(
        service.validateSession('session-1', 'valid-token'),
      ).resolves.toEqual(session);
    });
  });

  describe('rotateSessionToken (concurrency protection with row locking)', () => {
    it('successfully locks, validates and rotates token in a transaction', async () => {
      const rawToken = 'current-refresh-token';
      const currentHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      const session = {
        id: 'session-1',
        refresh_token_hash: currentHash,
        expires_at: new Date(Date.now() + 86400000),
      } as Session;

      const mockTransactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(session),
        save: jest.fn().mockImplementation((_entity, s) => Promise.resolve(s)),
      };

      manager.transaction.mockImplementation(
        async (cb: (em: unknown) => Promise<unknown>) => {
          return cb(mockTransactionalEntityManager);
        },
      );

      const newExpiresAt = new Date('2030-01-01');
      const rotated = await service.rotateSessionToken(
        'session-1',
        rawToken,
        'new-sha256-hash',
        newExpiresAt,
      );

      expect(mockTransactionalEntityManager.findOne).toHaveBeenCalledWith(
        Session,
        {
          where: { id: 'session-1' },
          lock: { mode: 'pessimistic_write' },
        },
      );
      expect(rotated.refresh_token_hash).toBe('new-sha256-hash');
      expect(rotated.expires_at).toEqual(newExpiresAt);
    });

    it('revokes session immediately when reuse detected inside transaction', async () => {
      const rawToken = 'old-token';
      const actualStoredHash = crypto
        .createHash('sha256')
        .update('different-token')
        .digest('hex');

      const session = {
        id: 'session-1',
        refresh_token_hash: actualStoredHash,
        expires_at: new Date(Date.now() + 86400000),
      } as Session;

      const mockTransactionalEntityManager = {
        findOne: jest.fn().mockResolvedValue(session),
        save: jest.fn().mockImplementation((_entity, s) => Promise.resolve(s)),
      };

      manager.transaction.mockImplementation(
        async (cb: (em: unknown) => Promise<unknown>) => {
          return cb(mockTransactionalEntityManager);
        },
      );

      await expect(
        service.rotateSessionToken(
          'session-1',
          rawToken,
          'new-hash',
          new Date(),
        ),
      ).rejects.toThrow(
        new UnauthorizedException('Refresh token reuse detected'),
      );

      expect(mockTransactionalEntityManager.save).toHaveBeenCalledWith(
        Session,
        expect.objectContaining({
          revoked_at: expect.any(Date),
        }),
      );
    });
  });
});
