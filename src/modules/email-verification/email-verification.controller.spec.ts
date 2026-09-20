import { EmailVerificationController } from './email-verification.controller';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationController', () => {
  let controller: EmailVerificationController;

  const emailVerificationService = {
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
  } as unknown as EmailVerificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new EmailVerificationController(emailVerificationService);
  });

  describe('verifyEmail', () => {
    it('delegates to EmailVerificationService and returns success message', async () => {
      (emailVerificationService.verifyEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.verifyEmail({ token: 'test-token' });

      expect(emailVerificationService.verifyEmail).toHaveBeenCalledWith({
        token: 'test-token',
      });
      expect(result).toEqual({ message: 'Email verified successfully' });
    });
  });

  describe('resendVerification', () => {
    it('delegates to EmailVerificationService and returns generic message', async () => {
      (
        emailVerificationService.resendVerification as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await controller.resendVerification({
        email: 'user@example.com',
      });

      expect(emailVerificationService.resendVerification).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
      expect(result).toEqual({
        message:
          'If your account requires verification, a new verification link has been sent.',
      });
    });
  });
});
