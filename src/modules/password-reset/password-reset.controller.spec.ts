import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { Request } from 'express';
import { ROLES } from '@common/constants/constants';

describe('PasswordResetController', () => {
  let controller: PasswordResetController;

  const passwordResetService = {
    handleForgotPassword: jest.fn(),
    handleResetPassword: jest.fn(),
    handleChangePassword: jest.fn(),
  } as unknown as PasswordResetService;

  const mockReq = {} as Request;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PasswordResetController(passwordResetService);
  });

  describe('forgotPassword', () => {
    it('delegates to PasswordResetService and returns generic message', async () => {
      (
        passwordResetService.handleForgotPassword as jest.Mock
      ).mockResolvedValue(undefined);

      const result = await controller.forgotPassword(
        { email: 'user@example.com' },
        mockReq,
      );

      expect(passwordResetService.handleForgotPassword).toHaveBeenCalledWith(
        { email: 'user@example.com' },
        mockReq,
      );
      expect(result).toEqual({
        message: 'Password reset email sent if the email exists in our system',
      });
    });
  });

  describe('resetPassword', () => {
    it('delegates to PasswordResetService and returns confirmation message', async () => {
      (passwordResetService.handleResetPassword as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.resetPassword(
        {
          email: 'user@example.com',
          token: 'token-123',
          password: 'NewPass123!',
        },
        mockReq,
      );

      expect(passwordResetService.handleResetPassword).toHaveBeenCalledWith(
        {
          email: 'user@example.com',
          token: 'token-123',
          password: 'NewPass123!',
        },
        mockReq,
      );
      expect(result).toEqual({
        message: 'Password has been reset successfully',
      });
    });
  });

  describe('changePassword', () => {
    it('delegates to PasswordResetService with authenticated user id', async () => {
      (
        passwordResetService.handleChangePassword as jest.Mock
      ).mockResolvedValue(undefined);

      const user = {
        userId: 'user-1',
        email: 'user@example.com',
        role: ROLES.USER,
      };

      const result = await controller.changePassword(
        user,
        {
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass123!',
        },
        mockReq,
      );

      expect(passwordResetService.handleChangePassword).toHaveBeenCalledWith(
        'user-1',
        {
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass123!',
        },
        mockReq,
      );
      expect(result).toEqual({
        message: 'Password has been changed successfully',
      });
    });
  });
});
