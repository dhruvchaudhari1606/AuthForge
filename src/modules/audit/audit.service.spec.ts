import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from '@database/entities/audit-log.entity';
import { LoggerService } from '@common/logger/logger.service';
import { AuditEvent } from '@common/constants/constants';

describe('AuditService', () => {
  let auditService: AuditService;

  const auditLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as unknown as Repository<AuditLog>;

  const loggerService = {
    log: jest.fn(),
    error: jest.fn(),
  } as unknown as LoggerService;

  beforeEach(() => {
    jest.clearAllMocks();
    auditService = new AuditService(auditLogRepository, loggerService);
  });

  describe('log', () => {
    it('creates and persists an audit log entry', async () => {
      const params = {
        userId: 'user-1',
        event: AuditEvent.AUTH_LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        metadata: { loginType: 'password' },
      };

      const createdEntry = { id: 'audit-1', ...params } as unknown as AuditLog;
      (auditLogRepository.create as jest.Mock).mockReturnValue(createdEntry);
      (auditLogRepository.save as jest.Mock).mockResolvedValue(createdEntry);

      const result = await auditService.log(params);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        user_id: 'user-1',
        event: AuditEvent.AUTH_LOGIN_SUCCESS,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
        metadata: { loginType: 'password' },
      });
      expect(auditLogRepository.save).toHaveBeenCalledWith(createdEntry);
      expect(result).toEqual(createdEntry);
    });

    it('catches repository errors without throwing and logs an error', async () => {
      (auditLogRepository.create as jest.Mock).mockReturnValue({});
      (auditLogRepository.save as jest.Mock).mockRejectedValue(
        new Error('Database unavailable'),
      );

      const result = await auditService.log({
        event: AuditEvent.AUTH_LOGIN_FAILURE,
      });

      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to record audit log for event AUTH_LOGIN_FAILURE',
        ),
        expect.any(String),
        AuditService.name,
      );
    });
  });

  describe('findByUserId', () => {
    it('returns audit logs for a user ordered by createdAt DESC', async () => {
      const logs = [{ id: '1' }, { id: '2' }] as AuditLog[];
      (auditLogRepository.find as jest.Mock).mockResolvedValue(logs);

      const result = await auditService.findByUserId('user-1', 20);

      expect(auditLogRepository.find).toHaveBeenCalledWith({
        where: { user_id: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 20,
      });
      expect(result).toEqual(logs);
    });
  });
});
