import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';
import { ROLES } from '@common/constants/constants';
import { AuthUser } from '@app-types/authUser.type';

type ParamDecoratorFactory = (
  data: keyof AuthUser | undefined,
  ctx: ExecutionContext,
) => unknown;

function getParamDecoratorFactory(): ParamDecoratorFactory {
  class TestClass {
    testMethod(@CurrentUser() _user: unknown) {
      return _user;
    }
  }

  const metadata = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestClass,
    'testMethod',
  ) as Record<string, { factory: ParamDecoratorFactory }>;
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('CurrentUser decorator', () => {
  const mockUser: AuthUser = {
    userId: 'user-123',
    email: 'user@example.com',
    role: ROLES.USER,
  };

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        user: mockUser,
      }),
    }),
  } as unknown as ExecutionContext;

  it('returns the entire user object when no key is specified', () => {
    const factory = getParamDecoratorFactory();
    const result = factory(undefined, mockContext);
    expect(result).toEqual(mockUser);
  });

  it('returns a specific field when property name is provided', () => {
    const factory = getParamDecoratorFactory();
    const result = factory('userId', mockContext);
    expect(result).toBe('user-123');
  });

  it('returns undefined if user is not present on request', () => {
    const emptyContext = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as unknown as ExecutionContext;

    const factory = getParamDecoratorFactory();
    expect(factory(undefined, emptyContext)).toBeUndefined();
    expect(factory('userId', emptyContext)).toBeUndefined();
  });
});
