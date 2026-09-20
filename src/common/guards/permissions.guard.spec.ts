import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { AuthorizationService } from '@modules/authorization/authorization.service';
import { ROLES } from '@common/constants/constants';

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
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users.read']);
    (authorizationService.getUserPermissions as jest.Mock).mockResolvedValue([
      'users.read',
      'users.update',
    ]);

    await expect(guard.canActivate(mockContext)).resolves.toBe(true);
  });

  it('denies access when user is missing any required permission', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      'users.read',
      'users.manage',
    ]);
    (authorizationService.getUserPermissions as jest.Mock).mockResolvedValue([
      'users.read',
    ]);

    await expect(guard.canActivate(mockContext)).resolves.toBe(false);
  });

  it('denies access when user is not present on request', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['users.read']);

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
