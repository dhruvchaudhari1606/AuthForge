import { ConfigService } from '@nestjs/config';
import { getRedisOptions, createRedisConnection } from './redis.util';

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({})),
}));

describe('redis.util', () => {
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRedisOptions', () => {
    it('returns redis configuration from ConfigService', () => {
      const redisConfig = { host: 'localhost', port: 6379 };
      (configService.get as jest.Mock).mockReturnValue(redisConfig);

      const result = getRedisOptions(configService);

      expect(configService.get).toHaveBeenCalledWith('redis');
      expect(result).toEqual(redisConfig);
    });

    it('returns config including optional password when present', () => {
      const redisConfig = {
        host: 'redis-host',
        port: 6380,
        password: 'secret',
      };
      (configService.get as jest.Mock).mockReturnValue(redisConfig);

      const result = getRedisOptions(configService);

      expect(result).toEqual(redisConfig);
    });
  });

  describe('createRedisConnection', () => {
    it('creates a Redis instance using options from ConfigService', () => {
      const redisConfig = { host: 'localhost', port: 6379 };
      (configService.get as jest.Mock).mockReturnValue(redisConfig);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Redis } = require('ioredis') as { Redis: jest.Mock };

      const connection = createRedisConnection(configService);

      expect(Redis).toHaveBeenCalledWith(redisConfig);
      expect(connection).toBeDefined();
    });
  });
});
