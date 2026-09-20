import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { Exclude } from 'class-transformer';
import { Session } from './session.entity';
import { PasswordReset } from './password-reset.entity';
import { EmailVerification } from './email-verification.entity';
import { AuditLog } from './audit-log.entity';
import { UserRole } from './user-role.entity';
import { UserStatus } from '@common/constants/constants';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  first_name?: string | null;

  @Column({ type: 'varchar', nullable: true })
  last_name?: string | null;

  @Index({ unique: true })
  @Column({ unique: true })
  email!: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password!: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  email_verified_at?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at?: Date | null;

  @Column({ default: 'en' })
  language!: string;

  @Column({ type: 'uuid', nullable: true })
  role_id?: string | null;

  @ManyToOne(() => Role, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'role_id' })
  role?: Role | null;

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles?: Role[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles?: UserRole[];

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => PasswordReset, (reset) => reset.user)
  passwordResets?: PasswordReset[];

  @OneToMany(() => EmailVerification, (verification) => verification.user)
  emailVerifications?: EmailVerification[];

  @OneToMany(() => AuditLog, (audit) => audit.user)
  auditLogs?: AuditLog[];

  @Column({ type: 'int', default: 0 })
  @Exclude({ toPlainOnly: true })
  token_version!: number;
}
