import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

@Injectable()
export class PasswordService {
  private readonly saltRounds: number;

  constructor(private readonly configService: ConfigService) {
    this.saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
      10,
    );
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    if (!plain || !hash) {
      return false;
    }
    return bcrypt.compare(plain, hash);
  }

  validateStrength(password: string): PasswordValidationResult {
    if (!password || password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return {
        isValid: false,
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      };
    }

    return { isValid: true };
  }
}
