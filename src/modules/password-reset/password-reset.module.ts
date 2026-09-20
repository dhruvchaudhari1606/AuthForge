import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PasswordReset } from '@database/entities/password-reset.entity';
import { User } from '@database/entities/user.entity';
import { MailModule } from '@modules/mail/mail.module';
import { AuthModule } from '@modules/auth/auth.module';
import { AuditModule } from '@modules/audit/audit.module';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PasswordReset, User]),
    MailModule,
    AuthModule,
    AuditModule,
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}
