import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createRedisConnection } from '@common/utils/redis.util';
import { LoggerService } from '@common/logger/logger.service';

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
    private readonly logger: LoggerService,
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
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
        HealthService.name,
      );
      return { status: 'down' };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    const redis = createRedisConnection(this.configService);

    try {
      const response: string = await redis.ping();
      const isUp = response === 'PONG';
      if (!isUp) {
        this.logger.warn(
          `Unexpected Redis response: ${response}`,
          HealthService.name,
        );
      }
      return {
        status: isUp ? 'up' : 'down',
      };
    } catch (error: unknown) {
      this.logger.error(
        'Redis health check failed',
        error instanceof Error ? error.stack : String(error),
        HealthService.name,
      );
      return { status: 'down' };
    } finally {
      await redis.quit();
    }
  }
}
