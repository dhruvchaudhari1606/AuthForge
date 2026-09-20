import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const getRedisOptions = (configService: ConfigService) =>
  configService.get<{ host: string; port: number; password?: string }>(
    'redis',
  )!;

export const createRedisConnection = (configService: ConfigService): Redis => {
  return new Redis(getRedisOptions(configService));
};
