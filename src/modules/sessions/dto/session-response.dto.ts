import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ description: 'Unique identifier of the session' })
  id!: string;

  @ApiProperty({
    description: 'Device name or user-agent derived label',
    nullable: true,
  })
  deviceName?: string | null;

  @ApiProperty({
    description: 'Device type (desktop, mobile, tablet, etc.)',
    nullable: true,
  })
  deviceType?: string | null;

  @ApiProperty({ description: 'Browser name and version', nullable: true })
  browser?: string | null;

  @ApiProperty({
    description: 'Operating system name and version',
    nullable: true,
  })
  os?: string | null;

  @ApiProperty({
    description: 'IP address of the client when active',
    nullable: true,
  })
  ipAddress?: string | null;

  @ApiProperty({
    description: 'Timestamp of when session was last active',
    nullable: true,
  })
  lastActiveAt?: Date | null;

  @ApiProperty({ description: 'Creation timestamp of the session' })
  createdAt!: Date;

  @ApiProperty({ description: 'Expiration timestamp of the session' })
  expiresAt!: Date;

  @ApiProperty({
    description:
      'Flag indicating if this is the active session making the request',
  })
  current!: boolean;
}
