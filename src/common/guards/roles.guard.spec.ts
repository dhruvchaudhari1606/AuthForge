import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const createContext = (role?: string) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: role ? { role } : undefined,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows requests when no roles are required', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows requests for users with required roles', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['admin']);
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('admin'))).toBe(true);
  });

  it('denies requests for users with missing roles', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['admin']);
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('user'))).toBe(false);
    expect(guard.canActivate(createContext())).toBe(false);
  });
});
