import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission names to assign to the role',
    example: ['users.read', 'users.update'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissionNames!: string[];
}
