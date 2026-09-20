import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_RULE_MESSAGE,
} from '@modules/auth/password/password-policy';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '8b77c0f64f7d1a648c76046f8ce9f2d9d95d20880ea4f2c84f0ebc0e9f3b909e',
  })
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description:
      'New password meeting criteria (min 8 chars, max 128, upper, lower, number, special character)',
  })
  @IsNotEmpty()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @Matches(PASSWORD_REGEX, {
    message: PASSWORD_RULE_MESSAGE,
  })
  password!: string;
}
