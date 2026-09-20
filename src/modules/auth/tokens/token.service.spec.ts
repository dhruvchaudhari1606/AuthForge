import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('TokenService', () => {
  const jwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const store: Record<string, unknown> = {
        'jwt.accessSecret': 'access-secret',
        'jwt.accessExpiresIn': '15m',
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.refreshExpiresIn': '30d',
        'security.bcryptSaltRounds': 10,
      };
      return store[key] !== undefined ? store[key] : defaultValue;
    }),
  } as unknown as ConfigService;

  const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
  const compareMock = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

  let service: TokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TokenService(jwtService, configService);
  });

  describe('generateAccessToken', () => {
    it('signs an access token with configured secret and expiry', () => {
      (jwtService.sign as jest.Mock).mockReturnValue('access-token');

      const payload = {
        sub: 'user-1',
        email: 'john@example.com',
        role: 'user',
        tokenVersion: 0,
      };

      const result = service.generateAccessToken(payload);

      expect(result).toBe('access-token');
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'access-secret',
        expiresIn: '15m',
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('signs a refresh token with configured secret and expiry', () => {
      (jwtService.sign as jest.Mock).mockReturnValue('refresh-token');

      const payload = {
        sub: 'user-1',
        sessionId: 'session-1',
        tokenVersion: 0,
      };

      const result = service.generateRefreshToken(payload);

      expect(result).toBe('refresh-token');
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: 'refresh-secret',
        expiresIn: '30d',
      });
    });
  });

  describe('verifyAccessToken & verifyRefreshToken', () => {
    it('verifies access token using access secret', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1',
      });

      const res = await service.verifyAccessToken('raw-jwt');
      expect(res).toEqual({ sub: 'user-1' });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('raw-jwt', {
        secret: 'access-secret',
      });
    });

    it('verifies refresh token using refresh secret', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        sessionId: 's-1',
      });

      const res = await service.verifyRefreshToken('raw-refresh-jwt');
      expect(res).toEqual({ sub: 'user-1', sessionId: 's-1' });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('raw-refresh-jwt', {
        secret: 'refresh-secret',
      });
    });
  });

  describe('hash and compare refresh token', () => {
    it('hashes the token using bcrypt with salt rounds 10', async () => {
      hashMock.mockResolvedValue('hashed-token' as never);

      const result = await service.hashRefreshToken('raw-token');

      expect(result).toBe('hashed-token');
      expect(hashMock).toHaveBeenCalledWith('raw-token', 10);
    });

    it('compares token using bcrypt.compare', async () => {
      compareMock.mockResolvedValue(true as never);

      const result = await service.compareRefreshToken(
        'raw-token',
        'hashed-token',
      );

      expect(result).toBe(true);
      expect(compareMock).toHaveBeenCalledWith('raw-token', 'hashed-token');
    });
  });
});
