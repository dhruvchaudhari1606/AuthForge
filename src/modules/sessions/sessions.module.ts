import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Session } from '@database/entities/session.entity';
import { SessionsController } from './sessions.controller';
import { SessionService } from './sessions.service';
import { SessionCleanupService } from './session-cleanup.service';
import { AuthModule } from '@modules/auth/auth.module';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
    AuditModule,
  ],
  controllers: [SessionsController],
  providers: [SessionService, SessionCleanupService],
  exports: [SessionService, SessionCleanupService],
})
export class SessionsModule {}
