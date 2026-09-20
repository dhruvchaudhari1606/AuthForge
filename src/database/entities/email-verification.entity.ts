import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';

@Entity('email_verifications')
@Index(['user_id', 'verified_at'])
export class EmailVerification extends BaseEntity {
  @Index()
  @Column('uuid')
  user_id!: string;

  @ManyToOne(() => User, (user) => user.emailVerifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Index()
  @Column({ type: 'varchar' })
  token_hash!: string;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  verified_at?: Date | null;
}
