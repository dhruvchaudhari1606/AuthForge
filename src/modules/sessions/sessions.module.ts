import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { AuditModule } from '@modules/audit/audit.module';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
