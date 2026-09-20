import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const getRedisConfig = (configService: ConfigService): RedisOptions => ({
  host: configService.get<string>('redis.host', 'localhost'),
  port: configService.get<number>('redis.port', 6379),
  password: configService.get<string>('redis.password') || undefined,
  db: configService.get<number>('redis.db', 0),
  keyPrefix: configService.get<string>('redis.keyPrefix', 'authforge:'),
  lazyConnect: true,
});
