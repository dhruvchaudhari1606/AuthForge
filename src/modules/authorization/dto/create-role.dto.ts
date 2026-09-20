import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique role identifier name (e.g. editor, manager)',
    example: 'manager',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Human-readable description of role purpose and scope',
    example: 'Manager with access to department users and reports',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
