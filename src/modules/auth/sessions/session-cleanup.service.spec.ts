import { Repository } from 'typeorm';
import { Session } from '@database/entities/session.entity';
import { SessionCleanupService } from './session-cleanup.service';

describe('SessionCleanupService', () => {
  const sessionRepository = {
    delete: jest.fn(),
  } as unknown as Repository<Session>;

  let service: SessionCleanupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SessionCleanupService(sessionRepository);
  });

  describe('cleanupExpiredSessions', () => {
    it('deletes sessions whose expires_at is in the past', async () => {
      (sessionRepository.delete as jest.Mock).mockResolvedValue({
        affected: 3,
      });

      await service.cleanupExpiredSessions();

      expect(sessionRepository.delete).toHaveBeenCalledTimes(1);
      const calls = (sessionRepository.delete as jest.Mock).mock.calls as Array<
        [{ expires_at: { value: Date } }]
      >;
      const callArg = calls[0][0];
      expect(callArg).toHaveProperty('expires_at');
      // The FindOperator wraps a Date value
      expect(callArg.expires_at.value).toBeInstanceOf(Date);
    });

    it('uses a date at the time of the call, not a fixed past date', async () => {
      (sessionRepository.delete as jest.Mock).mockResolvedValue({
        affected: 0,
      });

      const before = new Date();
      await service.cleanupExpiredSessions();
      const after = new Date();

      const calls = (sessionRepository.delete as jest.Mock).mock.calls as Array<
        [{ expires_at: { value: Date } }]
      >;
      const callArg = calls[0][0];
      const usedDate: Date = callArg.expires_at.value;

      expect(usedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(usedDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
