import {
  BadRequestException,
  ExecutionContext,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PasswordResetController } from '../../../src/modules/password-reset/password-reset.controller';
import { PasswordResetService } from '../../../src/modules/password-reset/password-reset.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { createE2eApp } from '../setup/create-e2e-app';

type RequestWithUser = {
  user?: { userId: string; email: string; role: string };
};

describe('Password Reset & Change routes (e2e)', () => {
  let app: INestApplication;

  const passwordResetServiceMock = {
    handleForgotPassword: jest.fn(),
    handleResetPassword: jest.fn(),
    handleChangePassword: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      req.user = { userId: 'user-1', email: 'john@example.com', role: 'user' };
      return true;
    }),
  };

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        controllers: [PasswordResetController],
        providers: [
          {
            provide: PasswordResetService,
            useValue: passwordResetServiceMock,
          },
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

  describe('POST /api/v1/auth/forgot-password', () => {
    it('returns 200 with generic confirmation message', async () => {
      passwordResetServiceMock.handleForgotPassword.mockResolvedValue(
        undefined,
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'john@example.com' })
        .expect(200);

      expect(
        passwordResetServiceMock.handleForgotPassword,
      ).toHaveBeenCalledWith({ email: 'john@example.com' }, expect.any(Object));
      expect(response.body).toMatchObject({
        success: true,
        data: {
          message:
            'Password reset email sent if the email exists in our system',
        },
      });
    });

    it('validates request email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
      });
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('returns 200 when reset credentials and token are valid', async () => {
      passwordResetServiceMock.handleResetPassword.mockResolvedValue(undefined);

      const payload = {
        email: 'john@example.com',
        token: 'valid-reset-token',
        password: 'NewStrongPassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send(payload)
        .expect(200);

      expect(passwordResetServiceMock.handleResetPassword).toHaveBeenCalledWith(
        payload,
        expect.any(Object),
      );
      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Password has been reset successfully' },
      });
    });

    it('returns 400 when token is invalid or expired', async () => {
      passwordResetServiceMock.handleResetPassword.mockRejectedValue(
        new BadRequestException('Invalid or expired token'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'john@example.com',
          token: 'expired-token',
          password: 'NewStrongPassword123!',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        message: 'Invalid or expired token',
      });
    });
  });

  describe('POST /api/v1/auth/change-password', () => {
    it('returns 200 when changing password with valid credentials', async () => {
      passwordResetServiceMock.handleChangePassword.mockResolvedValue(
        undefined,
      );

      const payload = {
        currentPassword: 'OldPassword123!',
        newPassword: 'BrandNewPassword123!',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .send(payload)
        .expect(200);

      expect(
        passwordResetServiceMock.handleChangePassword,
      ).toHaveBeenCalledWith('user-1', payload, expect.any(Object));
      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Password has been changed successfully' },
      });
    });

    it('returns 400 when current password is wrong', async () => {
      passwordResetServiceMock.handleChangePassword.mockRejectedValue(
        new BadRequestException('Current password is incorrect'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'BrandNewPassword123!',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        message: 'Current password is incorrect',
      });
    });
  });
});
