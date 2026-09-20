import { ConfigService } from '@nestjs/config';
import { CookieService } from './cookie.service';
import { Request, Response } from 'express';

describe('CookieService', () => {
  let service: CookieService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const store: Record<string, unknown> = {
          'app.env': 'development',
          'cookies.secure': false,
          'cookies.sameSite': 'lax',
          'cookies.path': '/',
          'cookies.accessTokenName': 'access_token',
          'cookies.refreshTokenName': 'refresh_token',
        };
        return store[key] !== undefined ? store[key] : defaultValue;
      }),
    } as unknown as ConfigService;

    service = new CookieService(configService);
  });

  it('sets access and refresh cookies with secure defaults', () => {
    const res = {
      cookie: jest.fn(),
    } as unknown as Response;

    service.setAuthCookies(res, {
      accessToken: 'acc-token',
      refreshToken: 'ref-token',
    });

    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'acc-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000,
      }),
    );

    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'ref-token',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it('clears access and refresh cookies', () => {
    const res = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    service.clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      'access_token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      }),
    );

    expect(res.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      }),
    );
  });

  it('extracts access token from cookie and falls back to authorization header', () => {
    const reqCookie = {
      cookies: { access_token: 'from-cookie' },
    } as unknown as Request;
    expect(service.extractAccessToken(reqCookie)).toBe('from-cookie');

    const reqHeader = {
      cookies: {},
      headers: { authorization: 'Bearer from-header' },
    } as unknown as Request;
    expect(service.extractAccessToken(reqHeader)).toBe('from-header');

    const reqNone = {
      cookies: {},
      headers: {},
    } as unknown as Request;
    expect(service.extractAccessToken(reqNone)).toBeNull();
  });

  it('extracts refresh token from cookies', () => {
    const req = {
      cookies: { refresh_token: 'my-refresh' },
    } as unknown as Request;
    expect(service.extractRefreshToken(req)).toBe('my-refresh');

    const reqEmpty = { cookies: {} } as unknown as Request;
    expect(service.extractRefreshToken(reqEmpty)).toBeNull();
  });
});
