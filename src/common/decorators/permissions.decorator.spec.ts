import 'reflect-metadata';
import { PERMISSIONS_KEY, RequirePermissions } from './permissions.decorator';

describe('RequirePermissions decorator', () => {
  it('attaches required permissions metadata to route handlers', () => {
    class TestController {
      @RequirePermissions('users.read', 'users.update')
      handler() {
        return true;
      }
    }

    const metadata = Reflect.getMetadata(
      PERMISSIONS_KEY,
      TestController.prototype.handler,
    ) as string[];

    expect(metadata).toEqual(['users.read', 'users.update']);
  });
});
