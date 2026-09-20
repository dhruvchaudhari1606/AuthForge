import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { Session } from '@database/entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(data: Partial<Session>): Promise<Session> {
    const session = this.sessionRepository.create(data);
    return this.sessionRepository.save(session);
  }

  async findSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { id: sessionId },
    });
  }

  async findSessionByUserId(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { user_id: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        user_id: userId,
        revoked_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
      order: { last_active_at: 'DESC' },
    });
  }

  async updateSessionToken(
    sessionId: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      refresh_token_hash: refreshTokenHash,
      expires_at: expiresAt,
      last_active_at: new Date(),
    });
  }

  async updateLastActive(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      last_active_at: new Date(),
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(sessionId, {
      revoked_at: new Date(),
    });
  }

  async revokeSessionForUser(
    sessionId: string,
    userId: string,
  ): Promise<Session> {
    const session = await this.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.user_id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to revoke this session',
      );
    }
    session.revoked_at = new Date();
    return this.sessionRepository.save(session);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { user_id: userId, revoked_at: IsNull() },
      { revoked_at: new Date() },
    );
  }

  async revokeOtherUserSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    await this.sessionRepository
      .createQueryBuilder()
      .update(Session)
      .set({ revoked_at: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('id != :currentSessionId', { currentSessionId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.sessionRepository.delete(sessionId);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ user_id: userId });
  }

  async compareTokenHash(token: string, storedHash: string): Promise<boolean> {
    if (!token || !storedHash) return false;

    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      return bcrypt.compare(token, storedHash);
    }

    try {
      const computed = crypto.createHash('sha256').update(token).digest('hex');

      const bufA = Buffer.from(computed, 'hex');
      const bufB = Buffer.from(storedHash, 'hex');
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  async validateSession(
    sessionId: string,
    refreshToken: string,
  ): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (session.revoked_at) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (session.expires_at < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    if (!session.refresh_token_hash) {
      throw new UnauthorizedException('Invalid session state');
    }

    const isMatch = await this.compareTokenHash(
      refreshToken,
      session.refresh_token_hash,
    );

    // TOKEN REUSE DETECTION
    if (!isMatch) {
      await this.revokeSession(sessionId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    return session;
  }

  /**
   * Concurrency-protected token rotation using a pessimistic write row lock
   * (SELECT ... FOR UPDATE). Prevents race conditions from simultaneous refresh requests.
   */
  async rotateSessionToken(
    sessionId: string,
    refreshToken: string,
    newRefreshTokenHash: string,
    newExpiresAt: Date,
  ): Promise<Session> {
    return this.sessionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const session = await transactionalEntityManager.findOne(Session, {
          where: { id: sessionId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!session) {
          throw new UnauthorizedException('Session not found');
        }

        if (session.revoked_at) {
          throw new UnauthorizedException('Session has been revoked');
        }

        if (session.expires_at < new Date()) {
          throw new UnauthorizedException('Session expired');
        }

        if (!session.refresh_token_hash) {
          throw new UnauthorizedException('Invalid session state');
        }

        const isMatch = await this.compareTokenHash(
          refreshToken,
          session.refresh_token_hash,
        );

        if (!isMatch) {
          session.revoked_at = new Date();
          await transactionalEntityManager.save(Session, session);
          throw new UnauthorizedException('Refresh token reuse detected');
        }

        session.refresh_token_hash = newRefreshTokenHash;
        session.expires_at = newExpiresAt;
        session.last_active_at = new Date();

        return transactionalEntityManager.save(Session, session);
      },
    );
  }
}

export { SessionService as SessionsService };
