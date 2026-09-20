import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '@database/entities/audit-log.entity';
import { AuditService } from './audit.service';
import { LoggerService } from '@common/logger/logger.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, LoggerService],
  exports: [AuditService],
})
export class AuditModule {}
