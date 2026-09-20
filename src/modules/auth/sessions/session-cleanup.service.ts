import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';

import { Session } from '@database/entities/session.entity';

@Injectable()
export class SessionCleanupService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  // runs every night at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredSessions() {
    await this.sessionRepository.delete({
      expires_at: LessThan(new Date()),
    });
  }
}
