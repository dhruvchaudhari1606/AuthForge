import { Request } from 'express';
import { QueryDto } from '@common/dto/query.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  const usersService = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
  } as unknown as UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated users from UsersService', async () => {
    const controller = new UsersController(usersService);
    const query: QueryDto = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'DESC',
    };

    (usersService.findAll as jest.Mock).mockResolvedValue({
      items: [],
      meta: {},
    });

    await expect(
      controller.getUsers({} as unknown as Request, query),
    ).resolves.toEqual({
      items: [],
      meta: {},
    });
    expect(usersService.findAll).toHaveBeenCalledWith(query);
  });

  it('returns profile data based on authenticated request user (/profile)', async () => {
    const controller = new UsersController(usersService);
    const req = {
      user: {
        email: 'john@example.com',
      },
    } as unknown as Request;

    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
    });

    await expect(controller.getProfile(req)).resolves.toEqual({
      id: 'user-1',
      email: 'john@example.com',
    });
    expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
  });

  it('returns profile data based on authenticated request user (/me)', async () => {
    const controller = new UsersController(usersService);
    const req = {
      user: {
        email: 'john@example.com',
      },
    } as unknown as Request;

    (usersService.findByEmail as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
    });

    await expect(controller.getMe(req)).resolves.toEqual({
      id: 'user-1',
      email: 'john@example.com',
    });
    expect(usersService.findByEmail).toHaveBeenCalledWith('john@example.com');
  });
});
