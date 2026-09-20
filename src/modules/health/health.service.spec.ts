import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@common/logger/logger.service';
import { HealthService } from './health.service';
import * as redisUtil from '@common/utils/redis.util';

describe('HealthService', () => {
  let dataSource: { query: jest.Mock };
  let configService: Partial<ConfigService>;
  let logger: { error: jest.Mock; warn: jest.Mock; log: jest.Mock };
  let mockRedis: { ping: jest.Mock; quit: jest.Mock };
  let service: HealthService;

  beforeEach(() => {
    dataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    configService = {
      get: jest.fn(),
    };
    logger = {
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };
    mockRedis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
    };

    jest
      .spyOn(redisUtil, 'createRedisConnection')
      .mockReturnValue(mockRedis as never);

    service = new HealthService(
      dataSource as unknown as DataSource,
      configService as ConfigService,
      logger as unknown as LoggerService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns ok status when database and redis are healthy', async () => {
    const result = await service.check();

    expect(result.status).toBe('ok');
    expect(result.checks.database).toEqual({ status: 'up' });
    expect(result.checks.redis).toEqual({ status: 'up' });
    expect(result.checks.database.message).toBeUndefined();
    expect(result.checks.redis.message).toBeUndefined();
  });

  it('does not leak internal database errors in health check payload', async () => {
    dataSource.query.mockRejectedValue(
      new Error('Sensitive DB connection string / secret leaked'),
    );

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.database).toEqual({ status: 'down' });
    expect(result.checks.database.message).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'Database health check failed',
      expect.stringContaining('Sensitive DB connection string'),
      HealthService.name,
    );
  });

  it('does not leak internal redis errors in health check payload', async () => {
    mockRedis.ping.mockRejectedValue(
      new Error('Redis auth failure: password123'),
    );

    const result = await service.check();

    expect(result.status).toBe('degraded');
    expect(result.checks.redis).toEqual({ status: 'down' });
    expect(result.checks.redis.message).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'Redis health check failed',
      expect.stringContaining('Redis auth failure'),
      HealthService.name,
    );
  });
});
