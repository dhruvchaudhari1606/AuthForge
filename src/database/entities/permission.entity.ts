import { Column, Entity, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles?: Role[];
}
