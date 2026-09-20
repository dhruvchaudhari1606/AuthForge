import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createRedisConnection } from '@common/utils/redis.util';

export interface DependencyHealth {
  status: 'up' | 'down';
  message?: string;
}

export interface HealthStatusPayload {
  status: 'ok' | 'degraded';
  timestamp: string;
  checks: {
    database: DependencyHealth;
    redis: DependencyHealth;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async check(): Promise<HealthStatusPayload> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const status =
      database.status === 'up' && redis.status === 'up' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
      },
    };
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error: unknown) {
      return {
        status: 'down',
        message:
          error instanceof Error ? error.message : 'Database check failed',
      };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    const redis = createRedisConnection(this.configService);

    try {
      const response: string = await redis.ping();
      return {
        status: response === 'PONG' ? 'up' : 'down',
        message:
          response === 'PONG'
            ? undefined
            : `Unexpected Redis response: ${response}`,
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        message: error instanceof Error ? error.message : 'Redis check failed',
      };
    } finally {
      await redis.quit();
    }
  }
}
