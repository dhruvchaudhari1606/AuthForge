import { JwtPayload, RefreshTokenPayload } from '@app-types/jwt.type';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    const secret =
      this.configService.get<string>('jwt.accessSecret') ||
      this.configService.get<string>('jwt.secret');
    const expiresIn = (this.configService.get<string>('jwt.accessExpiresIn') ||
      this.configService.get<string>('jwt.expiresIn') ||
      '15m') as StringValue;

    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  generateRefreshToken(payload: RefreshTokenPayload): string {
    const secret =
      this.configService.get<string>('jwt.refreshSecret') ||
      this.configService.get<string>('jwt.secret');
    const expiresIn = (this.configService.get<string>('jwt.refreshExpiresIn') ||
      '30d') as StringValue;

    return this.jwtService.sign(payload, {
      secret,
      expiresIn,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    const secret =
      this.configService.get<string>('jwt.accessSecret') ||
      this.configService.get<string>('jwt.secret');
    return this.jwtService.verifyAsync<JwtPayload>(token, { secret });
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const secret =
      this.configService.get<string>('jwt.refreshSecret') ||
      this.configService.get<string>('jwt.secret');
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, { secret });
  }

  async hashRefreshToken(token: string): Promise<string> {
    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
      10,
    );
    return bcrypt.hash(token, saltRounds);
  }

  async compareRefreshToken(plain: string, hash: string): Promise<boolean> {
    if (!plain || !hash) {
      return false;
    }
    return bcrypt.compare(plain, hash);
  }
}
