import {
  ConflictException,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { createE2eApp } from '../setup/create-e2e-app';
import { LoggerService } from '@common/logger/logger.service';

import { CookieService } from '../../../src/modules/auth/cookies/cookie.service';
import { User } from '../../../src/database/entities/user.entity';

type RequestWithUser = {
  user?: { userId: string; email: string; role: string };
};

describe('Auth routes (e2e)', () => {
  let app: INestApplication;

  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const mockConfigValues: Record<string, unknown> = {
    'app.env': 'development',
    'cookies.accessTokenName': 'access_token',
    'cookies.refreshTokenName': 'refresh_token',
    'cookies.sameSite': 'lax',
    'cookies.secure': false,
    'cookies.path': '/',
  };

  const configServiceMock = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      return mockConfigValues[key] !== undefined
        ? mockConfigValues[key]
        : (defaultValue ?? 'development');
    }),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      req.user = { userId: 'user-1', email: 'john@example.com', role: 'user' };
      return true;
    }),
  };

  const testLogger = {
    log: jest.fn(),
  };

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: authServiceMock },
          { provide: ConfigService, useValue: configServiceMock },
          { provide: LoggerService, useValue: testLogger },
          CookieService,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(jwtAuthGuardMock),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    configServiceMock.get.mockImplementation(
      (key: string, defaultValue?: unknown) => {
        return mockConfigValues[key] !== undefined
          ? mockConfigValues[key]
          : (defaultValue ?? 'development');
      },
    );
    jwtAuthGuardMock.canActivate.mockImplementation(
      (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest<RequestWithUser>();
        req.user = {
          userId: 'user-1',
          email: 'john@example.com',
          role: 'user',
        };
        return true;
      },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Register ──────────────────────────────────────────────────────────────

  it('POST /api/v1/auth/register creates a user', async () => {
    authServiceMock.register.mockResolvedValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: { name: 'user' },
      language: 'en',
    });

    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      language: 'en',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(201);

    expect(authServiceMock.register).toHaveBeenCalledWith(payload);
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: { name: 'user' },
        language: 'en',
      },
    });
  });

  it('POST /api/v1/auth/register strips password and token_version from serialized entity', async () => {
    const user = new User();
    user.id = 'user-secret';
    user.name = 'Secret User';
    user.email = 'secret@example.com';
    user.password = '$2b$10$secretHashedPasswordThatShouldNeverLeak';
    user.token_version = 42;
    user.language = 'en';

    authServiceMock.register.mockResolvedValue(user);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Secret User',
        email: 'secret@example.com',
        password: 'Password123!',
        language: 'en',
      })
      .expect(201);

    const body = response.body as {
      success: boolean;
      data: Record<string, unknown>;
    };

    expect(body.data['id']).toBe('user-secret');
    expect(body.data['email']).toBe('secret@example.com');
    expect(body.data['password']).toBeUndefined();
    expect(body.data['token_version']).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('secretHashedPassword');
  });

  it('POST /api/v1/auth/register validates request body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'John Doe',
        email: 'not-an-email',
        password: '123',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      path: '/api/v1/auth/register',
      message: expect.arrayContaining([
        'email must be an email',
        'password must be longer than or equal to 8 characters',
        'language must be one of the following values: en, fr, hin',
        'language should not be empty',
      ]),
    });
  });

  it('POST /api/v1/auth/register returns 409 when email is already taken', async () => {
    authServiceMock.register.mockRejectedValue(
      new ConflictException('User already exists'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Jane Doe',
        email: 'existing@example.com',
        password: 'Password123!',
        language: 'en',
      })
      .expect(409);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 409,
      message: 'User already exists',
    });
  });

  // ─── Login ─────────────────────────────────────────────────────────────────

  it('POST /api/v1/auth/login returns tokens and sets cookies', async () => {
    authServiceMock.login.mockResolvedValue({
      accessToken: 'jwt-token',
      refreshToken: 'refresh-token',
    });

    const payload = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(payload)
      .expect(201);

    expect(authServiceMock.login).toHaveBeenCalledWith(
      payload,
      expect.any(Object),
    );
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        message: 'Authenticated successfully',
      },
    });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('POST /api/v1/auth/login validates request body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      message: expect.arrayContaining([
        'email must be an email',
        'password should not be empty',
      ]),
    });
  });

  it('POST /api/v1/auth/login returns unauthorized error envelope', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'john@example.com',
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      statusCode: 401,
      message: 'Invalid credentials',
      path: '/api/v1/auth/login',
      timestamp: expect.any(String),
    });
  });

  // ─── Refresh ───────────────────────────────────────────────────────────────

  it('POST /api/v1/auth/refresh rotates tokens when refresh cookie is present', async () => {
    authServiceMock.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', ['refresh_token=old-refresh-token'])
      .expect(201);

    expect(authServiceMock.refresh).toHaveBeenCalledWith('old-refresh-token');
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        message: 'Tokens refreshed successfully',
      },
    });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token='))).toBe(true);
  });

  it('POST /api/v1/auth/refresh returns 401 when refresh cookie is absent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Refresh token missing',
    });
    expect(authServiceMock.refresh).not.toHaveBeenCalled();
  });

  it('POST /api/v1/auth/refresh returns 401 when token is invalid', async () => {
    authServiceMock.refresh.mockRejectedValue(
      new UnauthorizedException('Session not found'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', ['refresh_token=bad-token'])
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Session not found',
    });
  });

  // ─── Logout ────────────────────────────────────────────────────────────────

  it('POST /api/v1/auth/logout clears cookies when refresh cookie is present', async () => {
    authServiceMock.logout.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', ['refresh_token=some-refresh-token'])
      .expect(201);

    expect(authServiceMock.logout).toHaveBeenCalledWith('some-refresh-token');
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: { message: 'Logged out successfully' },
    });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
  });

  it('POST /api/v1/auth/logout succeeds and clears cookies even without refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .expect(201);

    expect(authServiceMock.logout).not.toHaveBeenCalled();
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: { message: 'Logged out successfully' },
    });
  });

  // ─── Logout All ────────────────────────────────────────────────────────────

  it('POST /api/v1/auth/logout-all invalidates all sessions for the user', async () => {
    authServiceMock.logoutAll.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/logout-all')
      .expect(201);

    expect(authServiceMock.logoutAll).toHaveBeenCalledWith('user-1');
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: { message: 'Logged out from all devices' },
    });

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
  });
});
