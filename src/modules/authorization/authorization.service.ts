import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Role } from '@database/entities/role.entity';
import { Permission } from '@database/entities/permission.entity';
import { User } from '@database/entities/user.entity';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent, ROLES } from '@common/constants/constants';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const SYSTEM_ROLES: string[] = [ROLES.ADMIN, ROLES.USER];

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly auditService: AuditService,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions', 'roles', 'roles.permissions'],
    });

    if (!user) {
      return [];
    }

    // Admins have all permissions by default
    const adminRoleName: string = ROLES.ADMIN;
    const isGlobalAdmin =
      user.role?.name === adminRoleName ||
      user.roles?.some((r) => r.name === adminRoleName);

    if (isGlobalAdmin) {
      const allPermissions = await this.permissionRepository.find();
      return allPermissions.map((p) => p.name);
    }

    const permissionSet = new Set<string>();

    if (user.role?.permissions) {
      for (const p of user.role.permissions) {
        permissionSet.add(p.name);
      }
    }

    if (user.roles) {
      for (const role of user.roles) {
        if (role.permissions) {
          for (const p of role.permissions) {
            permissionSet.add(p.name);
          }
        }
      }
    }

    return Array.from(permissionSet);
  }

  async hasPermission(
    userId: string,
    requiredPermission: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(requiredPermission);
  }

  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role', 'roles'],
    });

    if (!user) {
      return false;
    }

    if (user.role?.name === roleName) {
      return true;
    }

    return user.roles ? user.roles.some((r) => r.name === roleName) : false;
  }

  async getRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { name: 'ASC' },
    });
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`);
    }

    return role;
  }

  async createRole(actorId: string, dto: CreateRoleDto): Promise<Role> {
    const roleName = dto.name.trim().toLowerCase();

    const existing = await this.roleRepository.findOne({
      where: { name: roleName },
    });

    if (existing) {
      throw new ConflictException(`Role '${roleName}' already exists`);
    }

    const role = this.roleRepository.create({
      name: roleName,
      description: dto.description?.trim(),
      permissions: [],
    });

    const saved = await this.roleRepository.save(role);

    await this.auditService.log({
      userId: actorId,
      event: AuditEvent.ROLE_CREATED,
      metadata: { roleId: saved.id, roleName: saved.name },
    });

    return saved;
  }

  async updateRole(
    actorId: string,
    id: string,
    dto: UpdateRoleDto,
  ): Promise<Role> {
    const role = await this.getRoleById(id);

    if (dto.name && dto.name !== role.name) {
      const isSystemRole = SYSTEM_ROLES.includes(role.name);
      if (isSystemRole) {
        throw new BadRequestException(
          'Built-in system roles cannot be renamed',
        );
      }

      const conflict = await this.roleRepository.findOne({
        where: { name: dto.name.trim().toLowerCase() },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Role '${dto.name}' already exists`);
      }

      role.name = dto.name.trim().toLowerCase();
    }

    if (dto.description !== undefined) {
      role.description = dto.description.trim();
    }

    const saved = await this.roleRepository.save(role);

    await this.auditService.log({
      userId: actorId,
      event: AuditEvent.ROLE_UPDATED,
      metadata: { roleId: saved.id, roleName: saved.name },
    });

    return saved;
  }

  async deleteRole(actorId: string, id: string): Promise<void> {
    const role = await this.getRoleById(id);

    if (SYSTEM_ROLES.includes(role.name)) {
      throw new BadRequestException('Cannot delete built-in system role');
    }

    await this.roleRepository.delete(id);

    await this.auditService.log({
      userId: actorId,
      event: AuditEvent.ROLE_DELETED,
      metadata: { roleId: id, roleName: role.name },
    });
  }

  async getPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { name: 'ASC' },
    });
  }

  async assignPermissionsToRole(
    actorId: string,
    roleId: string,
    permissionNames: string[],
  ): Promise<Role> {
    const role = await this.getRoleById(roleId);

    const permissions = await this.permissionRepository.find({
      where: { name: In(permissionNames) },
    });

    role.permissions = permissions;
    const saved = await this.roleRepository.save(role);

    await this.auditService.log({
      userId: actorId,
      event: AuditEvent.PERMISSIONS_CHANGED,
      metadata: {
        roleId: saved.id,
        roleName: saved.name,
        assignedPermissions: permissionNames,
      },
    });

    return saved;
  }

  async assignRoleToUser(
    actorId: string,
    targetUserId: string,
    roleName: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['roles', 'role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${targetUserId}' not found`);
    }

    const role = await this.roleRepository.findOne({
      where: { name: roleName.trim().toLowerCase() },
    });

    if (!role) {
      throw new NotFoundException(`Role '${roleName}' not found`);
    }

    const currentRoles = user.roles ?? [];
    if (!currentRoles.some((r) => r.id === role.id)) {
      user.roles = [...currentRoles, role];
      await this.userRepository.save(user);

      await this.auditService.log({
        userId: actorId,
        event: AuditEvent.ROLE_ASSIGNED,
        metadata: { targetUserId, roleName: role.name },
      });
    }
  }

  async removeRoleFromUser(
    actorId: string,
    targetUserId: string,
    roleName: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${targetUserId}' not found`);
    }

    const currentRoles = user.roles ?? [];
    const updatedRoles = currentRoles.filter(
      (r) => r.name !== roleName.trim().toLowerCase(),
    );

    if (updatedRoles.length !== currentRoles.length) {
      user.roles = updatedRoles;
      await this.userRepository.save(user);

      await this.auditService.log({
        userId: actorId,
        event: AuditEvent.ROLE_REMOVED,
        metadata: { targetUserId, roleName },
      });
    }
  }
}
