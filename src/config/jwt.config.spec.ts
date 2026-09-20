import { ConfigService } from '@nestjs/config';
import { getJwtModuleConfig } from './jwt.config';

describe('jwt.config', () => {
  it('returns jwt options from jwt.secret and jwt.expiresIn when specific access keys not set', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'jwt.secret') return 'fallback-secret';
        if (key === 'jwt.expiresIn') return '15m';
        throw new Error(`Unexpected key: ${key}`);
      }),
    } as unknown as ConfigService;

    const result = getJwtModuleConfig(configService);

    expect(result).toEqual({
      secret: 'fallback-secret',
      signOptions: {
        expiresIn: '15m',
      },
    });
  });

  it('returns jwt options from jwt.accessSecret and jwt.accessExpiresIn when present', () => {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.accessSecret') return 'access-secret-key';
        if (key === 'jwt.accessExpiresIn') return '10m';
        return undefined;
      }),
      getOrThrow: jest.fn(),
    } as unknown as ConfigService;

    const result = getJwtModuleConfig(configService);

    expect(result).toEqual({
      secret: 'access-secret-key',
      signOptions: {
        expiresIn: '10m',
      },
    });
    expect(configService.getOrThrow).not.toHaveBeenCalled();
  });
});
