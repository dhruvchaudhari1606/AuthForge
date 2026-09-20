import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { EmailVerificationController } from '../../../src/modules/email-verification/email-verification.controller';
import { EmailVerificationService } from '../../../src/modules/email-verification/email-verification.service';
import { createE2eApp } from '../setup/create-e2e-app';

describe('Email Verification routes (e2e)', () => {
  let app: INestApplication;

  const emailVerificationServiceMock = {
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        controllers: [EmailVerificationController],
        providers: [
          {
            provide: EmailVerificationService,
            useValue: emailVerificationServiceMock,
          },
        ],
      }),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/verify-email', () => {
    it('returns 200 when email verification token is valid', async () => {
      emailVerificationServiceMock.verifyEmail.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'valid-verification-token' })
        .expect(200);

      expect(emailVerificationServiceMock.verifyEmail).toHaveBeenCalledWith({
        token: 'valid-verification-token',
      });
      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Email verified successfully' },
      });
    });

    it('returns 400 when token is invalid or expired', async () => {
      emailVerificationServiceMock.verifyEmail.mockRejectedValue(
        new BadRequestException('Invalid or expired verification token'),
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({ token: 'expired-token' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
        message: 'Invalid or expired verification token',
      });
    });

    it('validates request payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-email')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
      });
    });
  });

  describe('POST /api/v1/auth/resend-verification', () => {
    it('returns 200 with generic confirmation message', async () => {
      emailVerificationServiceMock.resendVerification.mockResolvedValue(
        undefined,
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'user@example.com' })
        .expect(200);

      expect(
        emailVerificationServiceMock.resendVerification,
      ).toHaveBeenCalledWith({
        email: 'user@example.com',
      });
      expect(response.body).toMatchObject({
        success: true,
        data: {
          message:
            'If your account requires verification, a new verification link has been sent.',
        },
      });
    });

    it('validates email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/resend-verification')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 400,
      });
    });
  });
});
