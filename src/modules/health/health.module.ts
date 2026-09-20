import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { LoggerService } from '@common/logger/logger.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService, LoggerService],
})
export class HealthModule {}
