import { LoggerService } from '@common/logger/logger.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { CookieService } from './cookies/cookie.service';
import { Request, Response } from 'express';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  } as unknown as AuthService;

  const configService = {
    get: jest.fn().mockReturnValue('development'),
  } as unknown as ConfigService;

  const logger = {
    warn: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
  } as unknown as LoggerService;

  const cookieService = {
    setAuthCookies: jest.fn(),
    clearAuthCookies: jest.fn(),
    extractAccessToken: jest.fn(),
    extractRefreshToken: jest.fn(),
  } as unknown as CookieService;

  const createController = () =>
    new AuthController(authService, configService, logger, cookieService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates register requests to AuthService', async () => {
    const controller = createController();
    const payload = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      language: 'en',
    };

    (authService.register as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    await expect(controller.register(payload)).resolves.toEqual({
      id: 'user-1',
    });
    expect(authService.register).toHaveBeenCalledWith(payload);
  });

  it('delegates login requests to AuthService and sets auth cookies', async () => {
    const controller = createController();
    const loginDto = {
      email: 'john@example.com',
      password: 'password123',
    };
    const req = {} as Request;
    const res = {} as Response;

    const tokenData = {
      accessToken: 'token',
      refreshToken: 'refresh-token',
    };
    (authService.login as jest.Mock).mockResolvedValue(tokenData);

    await expect(controller.login(req, loginDto, res)).resolves.toEqual({
      message: 'Authenticated successfully',
    });
    expect(authService.login).toHaveBeenCalledWith(loginDto, req);
    expect(cookieService.setAuthCookies).toHaveBeenCalledWith(res, tokenData);
  });

  it('throws UnauthorizedException when refresh token is missing', async () => {
    const controller = createController();
    const req = {} as Request;
    const res = {} as Response;

    (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(null);

    await expect(controller.refresh(req, res)).rejects.toThrow(
      'Refresh token missing',
    );
    expect(authService.refresh).not.toHaveBeenCalled();
    expect(cookieService.clearAuthCookies).toHaveBeenCalledWith(res);
  });

  it('sets new cookies and returns success message on successful refresh', async () => {
    const controller = createController();
    const req = {} as Request;
    const res = {} as Response;

    (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(
      'old-refresh',
    );

    const tokens = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    };
    (authService.refresh as jest.Mock).mockResolvedValue(tokens);

    const result = await controller.refresh(req, res);

    expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
    expect(cookieService.setAuthCookies).toHaveBeenCalledWith(res, tokens);
    expect(result).toEqual({ message: 'Tokens refreshed successfully' });
  });

  it('clears cookies and returns success message on logout', async () => {
    const controller = createController();
    const req = {} as Request;
    const res = {} as Response;

    (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(
      'some-refresh',
    );
    (authService.logout as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.logout(req, res);

    expect(authService.logout).toHaveBeenCalledWith('some-refresh');
    expect(cookieService.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(result).toEqual({ message: 'Logged out successfully' });
  });

  it('skips calling authService.logout when no refresh token on logout', async () => {
    const controller = createController();
    const req = {} as Request;
    const res = {} as Response;

    (cookieService.extractRefreshToken as jest.Mock).mockReturnValue(null);

    const result = await controller.logout(req, res);

    expect(authService.logout).not.toHaveBeenCalled();
    expect(cookieService.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(result).toEqual({ message: 'Logged out successfully' });
  });

  it('revokes all sessions and clears cookies on logoutAll', async () => {
    const controller = createController();
    const req = {
      user: { userId: 'user-1', email: 'john@example.com', role: 'user' },
    } as unknown as Request;
    const res = {} as Response;

    (authService.logoutAll as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.logoutAll(req, res);

    expect(authService.logoutAll).toHaveBeenCalledWith('user-1');
    expect(cookieService.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(result).toEqual({ message: 'Logged out from all devices' });
  });
});
