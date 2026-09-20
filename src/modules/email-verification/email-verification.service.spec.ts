import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerification } from '@database/entities/email-verification.entity';
import { User } from '@database/entities/user.entity';
import { MailService } from '@modules/mail/mail.service';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent, UserStatus } from '@common/constants/constants';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  const verificationRepository = {
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<EmailVerification>;

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

  const auditService = {
    log: jest.fn(),
  } as unknown as AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EmailVerificationService(
      verificationRepository,
      userRepository,
      mailService,
      configService,
      auditService,
    );
  });

  describe('createVerificationToken and sendVerificationEmail', () => {
    it('generates a secure token, saves hashed record, and sends email', async () => {
      const user = {
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        language: 'en',
      } as User;

      (verificationRepository.update as jest.Mock).mockResolvedValue(undefined);
      (verificationRepository.create as jest.Mock).mockReturnValue({
        id: 'ver-1',
      });
      (verificationRepository.save as jest.Mock).mockResolvedValue({
        id: 'ver-1',
      });
      (mailService.send as jest.Mock).mockResolvedValue(undefined);

      const token = await service.createVerificationToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(verificationRepository.update).toHaveBeenCalled();
      expect(verificationRepository.save).toHaveBeenCalled();

      await service.sendVerificationEmail(user, token);

      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          context: expect.objectContaining({
            name: 'John Doe',
            verificationLink: expect.stringContaining(token),
          }),
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('successfully verifies email and activates user account', async () => {
      const plainToken = 'valid-token-123';
      const tokenHash = service.hashToken(plainToken);

      const verificationRecord = {
        id: 'ver-1',
        user_id: 'user-1',
        token_hash: tokenHash,
        verified_at: null,
      } as EmailVerification;

      const user = {
        id: 'user-1',
        email: 'john@example.com',
        status: UserStatus.PENDING_VERIFICATION,
        email_verified_at: null,
      } as User;

      (verificationRepository.findOne as jest.Mock).mockResolvedValue(
        verificationRecord,
      );
      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (verificationRepository.save as jest.Mock).mockResolvedValue(
        verificationRecord,
      );
      (userRepository.save as jest.Mock).mockResolvedValue(user);

      await service.verifyEmail({ token: plainToken });

      expect(verificationRecord.verified_at).toBeInstanceOf(Date);
      expect(user.email_verified_at).toBeInstanceOf(Date);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          event: AuditEvent.EMAIL_VERIFIED,
        }),
      );
    });

    it('throws BadRequestException when token is not found or expired', async () => {
      (verificationRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.verifyEmail({ token: 'nonexistent-token' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when user is not found', async () => {
      (verificationRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'ver-1',
        user_id: 'deleted-user',
      });
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.verifyEmail({ token: 'any-token' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerification', () => {
    it('resends verification email when user exists and is not verified', async () => {
      const user = {
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        email_verified_at: null,
      } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (verificationRepository.update as jest.Mock).mockResolvedValue(undefined);
      (verificationRepository.create as jest.Mock).mockReturnValue({
        id: 'ver-1',
      });
      (verificationRepository.save as jest.Mock).mockResolvedValue({});
      (mailService.send as jest.Mock).mockResolvedValue(undefined);

      await service.resendVerification({ email: 'John@Example.com' });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
      expect(mailService.send).toHaveBeenCalled();
    });

    it('returns silently without sending email if user is already verified (enumeration protection)', async () => {
      const verifiedUser = {
        id: 'user-1',
        email: 'verified@example.com',
        email_verified_at: new Date(),
      } as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(verifiedUser);

      await service.resendVerification({ email: 'verified@example.com' });

      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('returns silently without throwing if user does not exist (enumeration protection)', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await service.resendVerification({ email: 'unknown@example.com' });

      expect(mailService.send).not.toHaveBeenCalled();
    });
  });
});
