import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe.new2@example.com' })
  @IsEmail()
  email!: string;
}
