import { AuthorizationController } from './authorization.controller';
import { AuthorizationService } from './authorization.service';
import { ROLES } from '@common/constants/constants';
import { Role } from '@database/entities/role.entity';

describe('AuthorizationController', () => {
  let controller: AuthorizationController;

  const authorizationService = {
    getRoles: jest.fn(),
    getRoleById: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    getPermissions: jest.fn(),
    assignPermissionsToRole: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
  } as unknown as AuthorizationService;

  const mockAdmin = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: ROLES.ADMIN,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthorizationController(authorizationService);
  });

  describe('getRoles and getRoleById', () => {
    it('returns all roles from authorization service', async () => {
      const roles = [{ id: '1', name: 'admin' }] as Role[];
      (authorizationService.getRoles as jest.Mock).mockResolvedValue(roles);

      const result = await controller.getRoles();
      expect(result).toEqual(roles);
    });

    it('returns a single role by id', async () => {
      const role = { id: 'role-1', name: 'user' } as Role;
      (authorizationService.getRoleById as jest.Mock).mockResolvedValue(role);

      const result = await controller.getRoleById('role-1');
      expect(result).toEqual(role);
      expect(authorizationService.getRoleById).toHaveBeenCalledWith('role-1');
    });
  });

  describe('createRole, updateRole, deleteRole', () => {
    it('delegates createRole with actor id and payload', async () => {
      const created = { id: 'role-2', name: 'editor' } as Role;
      (authorizationService.createRole as jest.Mock).mockResolvedValue(created);

      const result = await controller.createRole(mockAdmin, { name: 'editor' });
      expect(result).toEqual(created);
      expect(authorizationService.createRole).toHaveBeenCalledWith('admin-1', {
        name: 'editor',
      });
    });

    it('delegates updateRole with actor id, role id, and payload', async () => {
      const updated = { id: 'role-2', name: 'chief-editor' } as Role;
      (authorizationService.updateRole as jest.Mock).mockResolvedValue(updated);

      const result = await controller.updateRole('role-2', mockAdmin, {
        name: 'chief-editor',
      });
      expect(result).toEqual(updated);
      expect(authorizationService.updateRole).toHaveBeenCalledWith(
        'admin-1',
        'role-2',
        { name: 'chief-editor' },
      );
    });

    it('delegates deleteRole and returns confirmation', async () => {
      (authorizationService.deleteRole as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.deleteRole('role-2', mockAdmin);
      expect(result).toEqual({ message: 'Role deleted successfully' });
      expect(authorizationService.deleteRole).toHaveBeenCalledWith(
        'admin-1',
        'role-2',
      );
    });
  });

  describe('assignRoleToUser and removeRoleFromUser', () => {
    it('assigns role to target user', async () => {
      (authorizationService.assignRoleToUser as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.assignRoleToUser('user-1', mockAdmin, {
        roleName: 'editor',
      });
      expect(result).toEqual({
        message: "Role 'editor' assigned successfully",
      });
      expect(authorizationService.assignRoleToUser).toHaveBeenCalledWith(
        'admin-1',
        'user-1',
        'editor',
      );
    });

    it('removes role from target user', async () => {
      (authorizationService.removeRoleFromUser as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await controller.removeRoleFromUser(
        'user-1',
        'editor',
        mockAdmin,
      );
      expect(result).toEqual({ message: "Role 'editor' removed successfully" });
      expect(authorizationService.removeRoleFromUser).toHaveBeenCalledWith(
        'admin-1',
        'user-1',
        'editor',
      );
    });
  });
});
