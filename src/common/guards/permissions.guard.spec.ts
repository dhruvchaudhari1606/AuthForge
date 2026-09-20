import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { ROLES } from '@common/constants/constants';
import { PERMISSIONS } from '@common/constants/permissions.constant';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const authorizationService = {
    getUserPermissions: jest.fn(),
  } as unknown as AuthorizationService;

  const mockContext = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: { userId: 'user-1', email: 'john@example.com', role: ROLES.USER },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new PermissionsGuard(reflector, authorizationService);
  });

  it('allows access when no permissions are required', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    await expect(guard.canActivate(mockContext)).resolves.toBe(true);
  });

  it('allows access when user possesses all required permissions', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      PERMISSIONS.USERS_READ,
    ]);
    (authorizationService.getUserPermissions as jest.Mock).mockResolvedValue([
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_UPDATE,
    ]);

    await expect(guard.canActivate(mockContext)).resolves.toBe(true);
  });

  it('denies access when user is missing any required permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      PERMISSIONS.USERS_READ,
      'users.manage',
    ]);
    (authorizationService.getUserPermissions as jest.Mock).mockResolvedValue([
      PERMISSIONS.USERS_READ,
    ]);

    await expect(guard.canActivate(mockContext)).resolves.toBe(false);
  });

  it('denies access when user is not present on request', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      PERMISSIONS.USERS_READ,
    ]);

    const unauthContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(unauthContext)).resolves.toBe(false);
  });
});
