import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';

import { PasswordReset } from '@database/entities/password-reset.entity';
import { User } from '@database/entities/user.entity';
import { DeviceInfo, getDeviceInfo } from '@common/utils/device.util';
import { MailTemplate } from '@common/constants/mail.constants';
import { MailService } from '@modules/mail/mail.service';
import { PasswordService } from '@modules/auth/password/password.service';
import { SessionService } from '@modules/auth/sessions/session.service';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent } from '@common/constants/constants';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const RESET_TOKEN_EXPIRY_MINUTES = 15;
const DEFAULT_RESET_PASSWORD_PATH = '/reset-password';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly passwordService: PasswordService,
    private readonly sessionService: SessionService,
    private readonly auditService: AuditService,
  ) {}

  // Create Reset Token
  async createResetToken(
    user: User,
    ipAddress?: string,
    deviceInfo?: DeviceInfo,
  ): Promise<string> {
    // 1. Invalidate existing active tokens
    await this.passwordResetRepository.update(
      {
        user_id: user.id,
        used: false,
      },
      {
        used: true,
        token_hash: null,
      },
    );

    // 2. Generate secure random token
    const plainToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash token with bcrypt or sha256
    const tokenHash = await bcrypt.hash(plainToken, 10);

    // 4. Expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    // 5. Create record
    const reset = this.passwordResetRepository.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used: false,
      ip_address: ipAddress,
      user_agent: deviceInfo?.user_agent,
    });

    await this.passwordResetRepository.save(reset);

    // 6. Return plain token
    return plainToken;
  }

  // Validate Reset Token
  async validateResetToken(user: User, token: string): Promise<PasswordReset> {
    const reset = await this.passwordResetRepository.findOne({
      where: {
        user_id: user.id,
        used: false,
        expires_at: MoreThan(new Date()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!reset || !reset.token_hash) {
      throw new BadRequestException('Invalid or expired token');
    }

    const isMatch = await bcrypt.compare(token, reset.token_hash);

    if (!isMatch) {
      throw new BadRequestException('Invalid or expired token');
    }

    return reset;
  }

  // Consume Token
  async consumeResetToken(reset: PasswordReset): Promise<void> {
    reset.used = true;
    reset.token_hash = null;

    await this.passwordResetRepository.save(reset);
  }

  async handleForgotPassword(
    dto: ForgotPasswordDto,
    req: Request,
  ): Promise<void> {
    const { email } = dto;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    // Prevent email enumeration by returning early for unknown accounts.
    if (!user) {
      return;
    }

    const { deviceInfo, ipAddress } = this.extractRequestMetadata(req);

    const resetToken = await this.createResetToken(user, ipAddress, deviceInfo);

    const rawFrontendOrigin =
      this.configService.get<string>('cors.origin') ?? '';
    const frontendOrigin = rawFrontendOrigin
      .split(',')
      .map((value) => value.trim())
      .find(Boolean);

    const baseUrl = frontendOrigin || 'http://localhost:3000';

    let resetUrl: URL;
    try {
      resetUrl = new URL(DEFAULT_RESET_PASSWORD_PATH, baseUrl);
    } catch {
      resetUrl = new URL(DEFAULT_RESET_PASSWORD_PATH, 'http://localhost:3000');
    }

    resetUrl.searchParams.set('token', resetToken);
    resetUrl.searchParams.set('email', user.email);

    await this.mailService.send({
      to: user.email,
      subjectKey: 'mail.reset_subject',
      template: MailTemplate.RESET_PASSWORD,
      language: user.language,
      context: {
        name: user.name,
        resetLink: resetUrl.toString(),
        expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
        deviceName: deviceInfo.device_name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.device_type,
        ipAddress: ipAddress ?? 'Unknown',
        requestedAtUtc: new Date().toUTCString(),
      },
    });

    await this.auditService.log({
      userId: user.id,
      event: AuditEvent.PASSWORD_RESET_REQUESTED,
      ipAddress,
      userAgent: deviceInfo.user_agent,
    });
  }

  async handleResetPassword(
    dto: ResetPasswordDto,
    req: Request,
  ): Promise<void> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    const reset = await this.validateResetToken(user, dto.token);

    // Validate password policy
    const strengthResult = this.passwordService.validateStrength(dto.password);
    if (!strengthResult.isValid) {
      throw new BadRequestException(
        strengthResult.message ||
          'Password does not meet strength requirements',
      );
    }

    const hashedPassword = await this.passwordService.hash(dto.password);

    user.password = hashedPassword;
    user.token_version += 1;

    await this.userRepository.save(user);
    await this.consumeResetToken(reset);

    // Invalidate all active sessions across devices
    await this.sessionService.revokeAllUserSessions(user.id);

    const { deviceInfo, ipAddress } = this.extractRequestMetadata(req);

    await this.auditService.log({
      userId: user.id,
      event: AuditEvent.PASSWORD_RESET_COMPLETED,
      ipAddress,
      userAgent: deviceInfo.user_agent,
    });

    await this.mailService.send({
      to: user.email,
      subjectKey: 'mail.password_updated_subject',
      template: MailTemplate.PASSWORD_UPDATED,
      language: user.language,
      context: {
        name: user.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.device_type,
        deviceName: deviceInfo.device_name,
        ipAddress: ipAddress ?? 'Unknown',
        requestedAtUtc: new Date().toUTCString(),
      },
    });
  }

  async handleChangePassword(
    userId: string,
    dto: ChangePasswordDto,
    req: Request,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await this.passwordService.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password cannot be identical to current password',
      );
    }

    const strengthResult = this.passwordService.validateStrength(
      dto.newPassword,
    );
    if (!strengthResult.isValid) {
      throw new BadRequestException(
        strengthResult.message ||
          'Password does not meet strength requirements',
      );
    }

    user.password = await this.passwordService.hash(dto.newPassword);
    user.token_version += 1;

    await this.userRepository.save(user);

    // Invalidate user sessions
    await this.sessionService.revokeAllUserSessions(user.id);

    const { deviceInfo, ipAddress } = this.extractRequestMetadata(req);

    await this.auditService.log({
      userId: user.id,
      event: AuditEvent.PASSWORD_CHANGED,
      ipAddress,
      userAgent: deviceInfo.user_agent,
    });

    await this.mailService.send({
      to: user.email,
      subjectKey: 'mail.password_updated_subject',
      template: MailTemplate.PASSWORD_UPDATED,
      language: user.language,
      context: {
        name: user.name,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        deviceType: deviceInfo.device_type,
        deviceName: deviceInfo.device_name,
        ipAddress: ipAddress ?? 'Unknown',
        requestedAtUtc: new Date().toUTCString(),
      },
    });
  }

  private extractRequestMetadata(req: Request): {
    deviceInfo: DeviceInfo;
    ipAddress: string | undefined;
  } {
    const userAgent =
      (req?.get ? req.get('user-agent') : req?.headers?.['user-agent']) ?? '';
    const deviceInfo = getDeviceInfo(userAgent);

    const forwardedFor = req?.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;

    return {
      deviceInfo,
      ipAddress: forwardedIp || req?.ip,
    };
  }
}
