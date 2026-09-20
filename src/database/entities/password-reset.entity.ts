import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('password_resets')
@Index(['user_id', 'used'])
export class PasswordReset extends BaseEntity {
  @Index()
  @Column('uuid')
  user_id!: string;

  @ManyToOne(() => User, (user) => user.passwordResets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  token_hash!: string | null;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ default: false })
  used!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  used_at?: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ip_address?: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent?: string | null;
}
