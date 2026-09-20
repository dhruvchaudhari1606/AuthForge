import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Updated role name',
    example: 'team-manager',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Updated role description',
    example: 'Updated description for team managers',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
