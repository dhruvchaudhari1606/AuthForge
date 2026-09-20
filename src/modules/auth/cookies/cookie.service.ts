import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';
import ms, { StringValue } from 'ms';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class CookieService {
  constructor(private readonly configService: ConfigService) {}

  get accessTokenName(): string {
    return this.configService.get<string>(
      'cookies.accessTokenName',
      'access_token',
    );
  }

  get refreshTokenName(): string {
    return this.configService.get<string>(
      'cookies.refreshTokenName',
      'refresh_token',
    );
  }

  private getAccessMaxAgeMs(): number {
    const accessExpiresIn =
      this.configService.get<string>('jwt.accessExpiresIn') || '15m';
    return (
      (typeof ms === 'function'
        ? ms(accessExpiresIn as StringValue)
        : 15 * 60 * 1000) ?? 15 * 60 * 1000
    );
  }

  private getRefreshMaxAgeMs(): number {
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '30d';
    return (
      (typeof ms === 'function'
        ? ms(refreshExpiresIn as StringValue)
        : 30 * 24 * 60 * 60 * 1000) ?? 30 * 24 * 60 * 60 * 1000
    );
  }

  private getBaseCookieOptions(): CookieOptions {
    const isProduction =
      this.configService.get<string>('app.env') === 'production';
    const rawSecure = this.configService.get<boolean>(
      'cookies.secure',
      isProduction,
    );
    const secure = typeof rawSecure === 'boolean' ? rawSecure : isProduction;

    const rawSameSite = this.configService.get<string>(
      'cookies.sameSite',
      'lax',
    );
    const sameSite: 'lax' | 'strict' | 'none' = [
      'lax',
      'strict',
      'none',
    ].includes(rawSameSite)
      ? (rawSameSite as 'lax' | 'strict' | 'none')
      : 'lax';

    const domain =
      this.configService.get<string>('cookies.domain') || undefined;
    const path = this.configService.get<string>('cookies.path', '/');

    return {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path,
    };
  }

  setAuthCookies(res: Response, tokens: AuthTokens): void {
    const baseOptions = this.getBaseCookieOptions();

    // Access token cookie (synchronized with JWT access expiration)
    res.cookie(this.accessTokenName, tokens.accessToken, {
      ...baseOptions,
      maxAge: this.getAccessMaxAgeMs(),
    });

    // Refresh token cookie (synchronized with JWT refresh expiration)
    res.cookie(this.refreshTokenName, tokens.refreshToken, {
      ...baseOptions,
      maxAge: this.getRefreshMaxAgeMs(),
    });
  }

  clearAuthCookies(res: Response): void {
    const baseOptions = this.getBaseCookieOptions();

    res.clearCookie(this.accessTokenName, baseOptions);
    res.clearCookie(this.refreshTokenName, baseOptions);
  }

  extractAccessToken(req: Request): string | null {
    if (req?.cookies?.[this.accessTokenName]) {
      return req.cookies[this.accessTokenName] as string;
    }

    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  extractRefreshToken(req: Request): string | null {
    if (req?.cookies?.[this.refreshTokenName]) {
      return req.cookies[this.refreshTokenName] as string;
    }
    return null;
  }
}
