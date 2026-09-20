import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Plain verification token received via email',
    example: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
