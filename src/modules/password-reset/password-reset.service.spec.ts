import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PasswordResetService } from './password-reset.service';
import { PasswordReset } from '@database/entities/password-reset.entity';
import { User } from '@database/entities/user.entity';
import { MailService } from '@modules/mail/mail.service';
import { PasswordService } from '@modules/auth/password/password.service';
import { SessionService } from '@modules/auth/sessions/session.service';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent } from '@common/constants/constants';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  const mockTransactionalEntityManager = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const passwordResetRepository = {
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn(async (cb: (em: unknown) => Promise<unknown>) =>
        cb(mockTransactionalEntityManager),
      ),
      findOne: jest.fn(),
      save: jest.fn(),
    },
  } as unknown as Repository<PasswordReset>;

  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<User>;

  const mailService = {
    send: jest.fn(),
  } as unknown as MailService;

  const configService = {
    get: jest.fn().mockReturnValue('http://localhost:3000'),
  } as unknown as ConfigService;

  const passwordService = {
    hash: jest.fn(),
    compare: jest.fn(),
    validateStrength: jest.fn(),
  } as unknown as PasswordService;

  const sessionService = {
    revokeAllUserSessions: jest.fn(),
  } as unknown as SessionService;

  const auditService = {
    log: jest.fn(),
  } as unknown as AuditService;

  const mockReq = {
    headers: { 'user-agent': 'test-browser' },
    get: jest.fn().mockReturnValue('test-browser'),
    ip: '127.0.0.1',
  } as unknown as Request;

  const bcryptHashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
  const bcryptCompareMock = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    (
      passwordResetRepository.manager
        .transaction as unknown as jest.MockedFunction<
        (cb: (em: unknown) => Promise<unknown>) => Promise<unknown>
      >
    ).mockImplementation(async (cb: (em: unknown) => Promise<unknown>) =>
      cb(mockTransactionalEntityManager),
    );
    service = new PasswordResetService(
      passwordResetRepository,
      userRepository,
      mailService,
      configService,
      passwordService,
      sessionService,
      auditService,
    );
  });

  describe('handleForgotPassword', () => {
    it('creates reset token and sends email when user exists', async () => {
      const user = {
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        language: 'en',
      } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (passwordResetRepository.update as jest.Mock).mockResolvedValue(
        undefined,
      );
      bcryptHashMock.mockResolvedValue('hashed-token' as never);
      (passwordResetRepository.create as jest.Mock).mockReturnValue({
        id: 'reset-1',
      });
      (passwordResetRepository.save as jest.Mock).mockResolvedValue({});
      (mailService.send as jest.Mock).mockResolvedValue(undefined);

      await service.handleForgotPassword(
        { email: 'John@Example.com' },
        mockReq,
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'john@example.com' }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          event: AuditEvent.PASSWORD_RESET_REQUESTED,
        }),
      );
    });

    it('returns silently without error when user is not found (enumeration defense)', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await service.handleForgotPassword(
        { email: 'unknown@example.com' },
        mockReq,
      );

      expect(mailService.send).not.toHaveBeenCalled();
      expect(passwordResetRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('handleResetPassword', () => {
    it('resets password, revokes sessions, and sends notification email', async () => {
      const user = {
        id: 'user-1',
        email: 'john@example.com',
        password: 'old-hashed-password',
        token_version: 1,
      } as User;

      const resetRecord = {
        id: 'reset-1',
        user_id: 'user-1',
        token_hash: '$2b$10$legacyhashedtokenvalueforbackwardcompat',
        used: false,
      } as PasswordReset;

      mockTransactionalEntityManager.findOne.mockImplementation(
        (entity: unknown) => {
          if (entity === User) return Promise.resolve(user);
          if (entity === PasswordReset) return Promise.resolve(resetRecord);
          return Promise.resolve(null);
        },
      );
      mockTransactionalEntityManager.save.mockImplementation(
        (_entity: unknown, item: unknown) => Promise.resolve(item),
      );
      bcryptCompareMock.mockResolvedValue(true as never);
      (passwordService.validateStrength as jest.Mock).mockReturnValue({
        isValid: true,
      });
      (passwordService.hash as jest.Mock).mockResolvedValue(
        'new-hashed-password',
      );
      (sessionService.revokeAllUserSessions as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mailService.send as jest.Mock).mockResolvedValue(undefined);

      await service.handleResetPassword(
        {
          email: 'john@example.com',
          token: 'valid-plain-token',
          password: 'NewStrongPassword123!',
        },
        mockReq,
      );

      expect(user.password).toBe('new-hashed-password');
      expect(user.token_version).toBe(2);
      expect(resetRecord.used).toBe(true);
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          event: AuditEvent.PASSWORD_RESET_COMPLETED,
        }),
      );
      expect(mailService.send).toHaveBeenCalled();
    });

    it('successfully resets password using sha256 hashed token with timing-safe comparison', async () => {
      const user = {
        id: 'user-1',
        email: 'john@example.com',
        password: 'old-hashed-password',
        token_version: 1,
      } as User;

      const plainToken = 'secure-sha256-test-token-value';
      const sha256Hash = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

      const resetRecord = {
        id: 'reset-1',
        user_id: 'user-1',
        token_hash: sha256Hash,
        used: false,
      } as PasswordReset;

      mockTransactionalEntityManager.findOne.mockImplementation(
        (entity: unknown) => {
          if (entity === User) return Promise.resolve(user);
          if (entity === PasswordReset) return Promise.resolve(resetRecord);
          return Promise.resolve(null);
        },
      );
      mockTransactionalEntityManager.save.mockImplementation(
        (_entity: unknown, item: unknown) => Promise.resolve(item),
      );
      (passwordService.validateStrength as jest.Mock).mockReturnValue({
        isValid: true,
      });
      (passwordService.hash as jest.Mock).mockResolvedValue(
        'new-hashed-password',
      );
      (sessionService.revokeAllUserSessions as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mailService.send as jest.Mock).mockResolvedValue(undefined);

      await service.handleResetPassword(
        {
          email: 'john@example.com',
          token: plainToken,
          password: 'NewStrongPassword123!',
        },
        mockReq,
      );

      expect(user.password).toBe('new-hashed-password');
      expect(user.token_version).toBe(2);
      expect(resetRecord.used).toBe(true);
      expect(resetRecord.token_hash).toBeNull();
    });

    it('throws BadRequestException if password policy check fails', async () => {
      const user = { id: 'user-1', email: 'john@example.com' } as User;
      const resetRecord = {
        id: 'reset-1',
        token_hash: 'hash',
      } as PasswordReset;

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (passwordResetRepository.findOne as jest.Mock).mockResolvedValue(
        resetRecord,
      );
      bcryptCompareMock.mockResolvedValue(true as never);
      (passwordService.validateStrength as jest.Mock).mockReturnValue({
        isValid: false,
        message: 'Password must contain at least 1 uppercase letter',
      });

      await expect(
        service.handleResetPassword(
          {
            email: 'john@example.com',
            token: 'valid-plain-token',
            password: 'weak',
          },
          mockReq,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleChangePassword', () => {
    it('verifies current password, updates to new password, and revokes sessions', async () => {
      const user = {
        id: 'user-1',
        password: 'current-hashed-password',
        token_version: 1,
        email: 'john@example.com',
      } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);
      (passwordService.validateStrength as jest.Mock).mockReturnValue({
        isValid: true,
      });
      (passwordService.hash as jest.Mock).mockResolvedValue(
        'updated-hashed-password',
      );
      (userRepository.save as jest.Mock).mockResolvedValue(user);
      (sessionService.revokeAllUserSessions as jest.Mock).mockResolvedValue(
        undefined,
      );
      (mailService.send as jest.Mock).mockResolvedValue(undefined);

      await service.handleChangePassword(
        'user-1',
        {
          currentPassword: 'OldPassword123!',
          newPassword: 'BrandNewPassword123!',
        },
        mockReq,
      );

      expect(user.password).toBe('updated-hashed-password');
      expect(user.token_version).toBe(2);
      expect(sessionService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          event: AuditEvent.PASSWORD_CHANGED,
        }),
      );
    });

    it('throws BadRequestException when current password does not match', async () => {
      const user = { id: 'user-1', password: 'hashed' } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (passwordService.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.handleChangePassword(
          'user-1',
          {
            currentPassword: 'WrongPassword',
            newPassword: 'NewPassword123!',
          },
          mockReq,
        ),
      ).rejects.toThrow(
        new BadRequestException('Current password is incorrect'),
      );
    });

    it('throws BadRequestException when new password is identical to current password', async () => {
      const user = { id: 'user-1', password: 'hashed' } as User;
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (passwordService.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.handleChangePassword(
          'user-1',
          {
            currentPassword: 'SamePassword123!',
            newPassword: 'SamePassword123!',
          },
          mockReq,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'New password cannot be identical to current password',
        ),
      );
    });

    it('throws NotFoundException when user is not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleChangePassword(
          'missing-user',
          {
            currentPassword: 'pass',
            newPassword: 'pass',
          },
          mockReq,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
