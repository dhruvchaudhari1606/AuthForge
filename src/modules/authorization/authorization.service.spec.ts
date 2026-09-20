import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { AuthorizationService } from './authorization.service';
import { Role } from '@database/entities/role.entity';
import { Permission } from '@database/entities/permission.entity';
import { User } from '@database/entities/user.entity';
import { AuditService } from '@modules/audit/audit.service';
import { AuditEvent, ROLES } from '@common/constants/constants';

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  const roleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as Repository<Role>;

  const permissionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<Permission>;

  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<User>;

  const auditService = {
    log: jest.fn(),
  } as unknown as AuditService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthorizationService(
      roleRepository,
      permissionRepository,
      userRepository,
      auditService,
    );
  });

  describe('getUserPermissions and hasPermission', () => {
    it('returns all system permissions when user is an admin', async () => {
      const adminUser = {
        id: 'user-1',
        roles: [{ name: ROLES.ADMIN }],
      } as unknown as User;

      const allPermissions = [
        { id: 'p1', name: 'users.read' },
        { id: 'p2', name: 'roles.manage' },
      ] as Permission[];

      (userRepository.findOne as jest.Mock).mockResolvedValue(adminUser);
      (permissionRepository.find as jest.Mock).mockResolvedValue(
        allPermissions,
      );

      const perms = await service.getUserPermissions('user-1');
      expect(perms).toEqual(['users.read', 'roles.manage']);

      const has = await service.hasPermission('user-1', 'roles.manage');
      expect(has).toBe(true);
    });

    it('returns role-specific permissions for standard user', async () => {
      const standardUser = {
        id: 'user-2',
        roles: [
          {
            name: ROLES.USER,
            permissions: [{ id: 'p1', name: 'users.read' }],
          },
        ],
      } as unknown as User;

      (userRepository.findOne as jest.Mock).mockResolvedValue(standardUser);

      const perms = await service.getUserPermissions('user-2');
      expect(perms).toEqual(['users.read']);

      const hasRead = await service.hasPermission('user-2', 'users.read');
      expect(hasRead).toBe(true);

      const hasManage = await service.hasPermission('user-2', 'roles.manage');
      expect(hasManage).toBe(false);
    });

    it('returns empty array when user is not found', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      const perms = await service.getUserPermissions('ghost');
      expect(perms).toEqual([]);
    });
  });

  describe('createRole', () => {
    it('creates a new role with lowercase name and logs audit', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue(null);
      const roleInstance = { id: 'r1', name: 'moderator', permissions: [] };
      (roleRepository.create as jest.Mock).mockReturnValue(roleInstance);
      (roleRepository.save as jest.Mock).mockResolvedValue(roleInstance);

      const result = await service.createRole('admin-1', {
        name: 'Moderator',
        description: 'Content moderator',
      });

      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'moderator',
        description: 'Content moderator',
        permissions: [],
      });
      expect(result).toEqual(roleInstance);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          event: AuditEvent.ROLE_CREATED,
        }),
      );
    });

    it('throws ConflictException when role name already exists', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'r1',
        name: 'editor',
      });

      await expect(
        service.createRole('admin-1', { name: 'editor' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole and deleteRole', () => {
    it('prevents renaming of built-in system roles', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'r-admin',
        name: 'admin',
      });

      await expect(
        service.updateRole('admin-1', 'r-admin', { name: 'super-admin' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents deleting built-in system roles', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'r-admin',
        name: 'admin',
      });

      await expect(service.deleteRole('admin-1', 'r-admin')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes a custom role and logs audit event', async () => {
      (roleRepository.findOne as jest.Mock).mockResolvedValue({
        id: 'r-custom',
        name: 'support-agent',
      });
      (roleRepository.delete as jest.Mock).mockResolvedValue(undefined);

      await service.deleteRole('admin-1', 'r-custom');

      expect(roleRepository.delete).toHaveBeenCalledWith('r-custom');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          event: AuditEvent.ROLE_DELETED,
        }),
      );
    });
  });

  describe('assignRoleToUser and removeRoleFromUser', () => {
    it('assigns role to target user when not already assigned', async () => {
      const user = { id: 'u1', roles: [] } as unknown as User;
      const role = { id: 'r1', name: 'moderator' } as Role;

      (userRepository.findOne as jest.Mock).mockResolvedValue(user);
      (roleRepository.findOne as jest.Mock).mockResolvedValue(role);
      (userRepository.save as jest.Mock).mockResolvedValue(user);

      await service.assignRoleToUser('admin-1', 'u1', 'moderator');

      expect(user.roles).toContain(role);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-1',
          event: AuditEvent.ROLE_ASSIGNED,
        }),
      );
    });

    it('throws NotFoundException when target user does not exist', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('admin-1', 'ghost', 'moderator'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when role does not exist', async () => {
      (userRepository.findOne as jest.Mock).mockResolvedValue({ id: 'u1' });
      (roleRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.assignRoleToUser('admin-1', 'u1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
