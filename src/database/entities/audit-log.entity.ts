import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';
import { AuditEvent } from '@common/constants/constants';

@Entity('audit_logs')
@Index(['user_id', 'event'])
export class AuditLog extends BaseEntity {
  @Index()
  @Column('uuid', { nullable: true })
  user_id?: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Index()
  @Column({
    type: 'varchar',
    length: 100,
  })
  event!: AuditEvent | string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip_address?: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;
}
