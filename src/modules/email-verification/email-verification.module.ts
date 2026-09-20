import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerification } from '@database/entities/email-verification.entity';
import { User } from '@database/entities/user.entity';
import { MailModule } from '@modules/mail/mail.module';
import { AuditModule } from '@modules/audit/audit.module';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerificationController } from './email-verification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerification, User]),
    MailModule,
    AuditModule,
  ],
  controllers: [EmailVerificationController],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
