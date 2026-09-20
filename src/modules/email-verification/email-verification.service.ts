import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';

import { EmailVerification } from '@database/entities/email-verification.entity';
import { User } from '@database/entities/user.entity';
import { MailService } from '@modules/mail/mail.service';
import { MailTemplate } from '@common/constants/mail.constants';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent, UserStatus } from '@common/constants/constants';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';

const VERIFICATION_TOKEN_EXPIRY_HOURS = 24;
const DEFAULT_VERIFY_EMAIL_PATH = '/verify-email';

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectRepository(EmailVerification)
    private readonly verificationRepository: Repository<EmailVerification>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createVerificationToken(user: User): Promise<string> {
    // 1. Invalidate any existing active verification requests
    await this.verificationRepository.update(
      {
        user_id: user.id,
        verified_at: IsNull(),
      },
      {
        verified_at: new Date(),
      },
    );

    // 2. Generate cryptographically strong random token
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plainToken);

    // 3. Expiration: 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

    // 4. Save record
    const record = this.verificationRepository.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      verified_at: null,
    });

    await this.verificationRepository.save(record);

    return plainToken;
  }

  async sendVerificationEmail(user: User, plainToken: string): Promise<void> {
    const rawFrontendOrigin =
      this.configService.get<string>('cors.origin') ?? '';
    const frontendOrigin = rawFrontendOrigin
      .split(',')
      .map((value) => value.trim())
      .find(Boolean);

    const baseUrl = frontendOrigin || 'http://localhost:3000';

    let verifyUrl: URL;
    try {
      verifyUrl = new URL(DEFAULT_VERIFY_EMAIL_PATH, baseUrl);
    } catch {
      verifyUrl = new URL(DEFAULT_VERIFY_EMAIL_PATH, 'http://localhost:3000');
    }

    verifyUrl.searchParams.set('token', plainToken);
    verifyUrl.searchParams.set('email', user.email);

    await this.mailService.send({
      to: user.email,
      subjectKey: 'mail.verify_email_subject',
      template: MailTemplate.VERIFY_EMAIL,
      language: user.language || 'en',
      context: {
        name: user.name,
        verificationLink: verifyUrl.toString(),
        expiresInHours: VERIFICATION_TOKEN_EXPIRY_HOURS,
      },
    });
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const record = await this.verificationRepository.findOne({
      where: {
        token_hash: tokenHash,
        verified_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const user = await this.userRepository.findOne({
      where: { id: record.user_id },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Mark verification record verified
    record.verified_at = new Date();
    await this.verificationRepository.save(record);

    // Activate user
    user.email_verified_at = new Date();
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      user.status = UserStatus.ACTIVE;
    }
    await this.userRepository.save(user);

    await this.auditService.log({
      userId: user.id,
      event: AuditEvent.EMAIL_VERIFIED,
      metadata: { email: user.email },
    });

    await this.mailService.send({
      to: user.email,
      subjectKey: 'mail.welcome_subject',
      template: MailTemplate.WELCOME,
      language: user.language || 'en',
      context: {
        name: user.name,
      },
    });
  }

  async sendVerification(user: User): Promise<string> {
    const token = await this.createVerificationToken(user);
    await this.sendVerificationEmail(user, token);
    return token;
  }

  async resendVerification(dto: ResendVerificationDto): Promise<void> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    // Enumeration-resistant: if user not found or already verified, return silently
    if (!user || user.email_verified_at) {
      return;
    }

    await this.sendVerification(user);
  }
}
