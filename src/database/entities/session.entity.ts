import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('user_sessions')
@Index(['user_id', 'revoked_at'])
export class Session extends BaseEntity {
  @Index()
  @Column('uuid')
  user_id!: string;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  refresh_token_hash!: string;

  @Column({ type: 'varchar', nullable: true })
  device_name!: string;

  @Column({ type: 'varchar', nullable: true })
  device_type!: string;

  @Column({ type: 'varchar', nullable: true })
  browser!: string;

  @Column({ type: 'varchar', nullable: true })
  os!: string;

  @Column({ type: 'text', nullable: true })
  user_agent!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip_address!: string;

  @Column({ type: 'timestamp', nullable: true })
  last_active_at!: Date;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  revoked_at?: Date | null;
}
