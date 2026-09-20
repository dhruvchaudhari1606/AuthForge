import 'reflect-metadata';
import { PERMISSIONS_KEY, RequirePermissions } from './permissions.decorator';
import { PERMISSIONS } from '../constants/permissions.constant';

describe('RequirePermissions decorator', () => {
  it('attaches required permissions metadata to route handlers using constants', () => {
    class TestController {
      @RequirePermissions(PERMISSIONS.USERS_READ, PERMISSIONS.USERS_UPDATE)
      handler() {
        return true;
      }
    }

    const metadata = Reflect.getMetadata(
      PERMISSIONS_KEY,
      TestController.prototype.handler,
    ) as string[];

    expect(metadata).toEqual([
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_UPDATE,
    ]);
  });
});
