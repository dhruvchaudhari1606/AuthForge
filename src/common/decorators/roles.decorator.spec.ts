import 'reflect-metadata';
import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles decorator', () => {
  it('attaches role metadata to route handlers', () => {
    class TestController {
      @Roles('admin', 'user')
      handler() {
        return true;
      }
    }

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.handler,
    ) as string[];

    expect(metadata).toEqual(['admin', 'user']);
  });
});
