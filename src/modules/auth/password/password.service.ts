import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_RULE_MESSAGE,
} from './password-policy';

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
    if (!password || password.length < PASSWORD_MIN_LENGTH) {
      return {
        isValid: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      };
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      return {
        isValid: false,
        message: `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`,
      };
    }

    if (!PASSWORD_REGEX.test(password)) {
      return {
        isValid: false,
        message: PASSWORD_RULE_MESSAGE,
      };
    }

    return { isValid: true };
  }
}
