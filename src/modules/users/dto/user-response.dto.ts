import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserStatus } from '@common/constants/constants';

class RoleResponseDto {
  @ApiProperty({ description: 'Role UUID' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Role name', example: 'user' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ description: 'Role description' })
  @Expose()
  description?: string | null;
}

@Exclude()
export class UserResponseDto {
  @ApiProperty({ description: 'User unique identifier (UUID)' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'User display name', example: 'Jane Doe' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ description: 'First name' })
  @Expose()
  first_name?: string | null;

  @ApiPropertyOptional({ description: 'Last name' })
  @Expose()
  last_name?: string | null;

  @ApiProperty({
    description: 'User email address',
    example: 'jane@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @Expose()
  status!: UserStatus;

  @ApiPropertyOptional({ description: 'Timestamp when email was verified' })
  @Expose()
  email_verified_at?: Date | null;

  @ApiPropertyOptional({ description: 'Timestamp of last login' })
  @Expose()
  last_login_at?: Date | null;

  @ApiProperty({
    description: 'Preferred user interface language',
    example: 'en',
  })
  @Expose()
  language!: string;

  @ApiPropertyOptional({
    description: 'Assigned primary role',
    type: () => RoleResponseDto,
  })
  @Expose()
  @Type(() => RoleResponseDto)
  role?: RoleResponseDto | null;

  @ApiPropertyOptional({
    description: 'Assigned roles list',
    type: () => [RoleResponseDto],
  })
  @Expose()
  @Type(() => RoleResponseDto)
  roles?: RoleResponseDto[];

  @ApiProperty({ description: 'Account creation timestamp' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  @Expose()
  updatedAt!: Date;
}
