import { JwtModuleOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

export const getJwtModuleConfig = (
  configService: ConfigService,
): JwtModuleOptions => ({
  secret:
    configService.get<string>('jwt.accessSecret') ||
    configService.getOrThrow<string>('jwt.secret'),
  signOptions: {
    expiresIn: (configService.get<string>('jwt.accessExpiresIn') ||
      configService.getOrThrow<string>('jwt.expiresIn')) as StringValue,
  },
});
