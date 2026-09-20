import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '8b77c0f64f7d1a648c76046f8ce9f2d9d95d20880ea4f2c84f0ebc0e9f3b909e',
  })
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewSecurePassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
