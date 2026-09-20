import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Name of the role to assign to the user',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  roleName!: string;
}
