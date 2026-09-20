import { ConfigService } from '@nestjs/config';
import { getRedisConfig } from './redis.config';

describe('redis.config', () => {
  it('returns default Redis configuration when optional values are omitted', () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const store: Record<string, unknown> = {
          'redis.host': 'localhost',
          'redis.port': 6379,
          'redis.password': undefined,
          'redis.db': 0,
          'redis.keyPrefix': 'authforge:',
        };
        return store[key] !== undefined ? store[key] : defaultValue;
      }),
    } as unknown as ConfigService;

    const config = getRedisConfig(configService);

    expect(config).toEqual({
      host: 'localhost',
      port: 6379,
      password: undefined,
      db: 0,
      keyPrefix: 'authforge:',
      lazyConnect: true,
    });
  });

  it('returns custom Redis configuration when provided', () => {
    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const store: Record<string, unknown> = {
          'redis.host': 'cache.internal',
          'redis.port': 6380,
          'redis.password': 'supersecretredis',
          'redis.db': 2,
          'redis.keyPrefix': 'custom-prefix:',
        };
        return store[key] !== undefined ? store[key] : defaultValue;
      }),
    } as unknown as ConfigService;

    const config = getRedisConfig(configService);

    expect(config).toEqual({
      host: 'cache.internal',
      port: 6380,
      password: 'supersecretredis',
      db: 2,
      keyPrefix: 'custom-prefix:',
      lazyConnect: true,
    });
  });
});
