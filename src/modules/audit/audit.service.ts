import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@database/entities/audit-log.entity';
import { AuditEvent } from '@common/constants/constants';
import { LoggerService } from '@common/logger/logger.service';

export interface CreateAuditLogParams {
  userId?: string | null;
  event: AuditEvent | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly logger: LoggerService,
  ) {}

  async log(params: CreateAuditLogParams): Promise<AuditLog | null> {
    try {
      const entry = this.auditLogRepository.create({
        user_id: params.userId ?? null,
        event: params.event,
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null,
        metadata: params.metadata ?? null,
      });

      return await this.auditLogRepository.save(entry);
    } catch (error) {
      // Audit failure must never crash core business operations
      this.logger.error(
        `Failed to record audit log for event ${params.event}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
        AuditService.name,
      );
      return null;
    }
  }

  async findByUserId(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { user_id: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
