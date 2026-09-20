import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { QueryDto } from '@common/dto/query.dto';
import { Role } from '@database/entities/role.entity';
import { User } from '@database/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { MailTemplate } from '@common/constants/mail.constants';
import { MailService } from '@modules/mail/mail.service';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  const userRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  } as unknown as Repository<User>;

  const roleRepository = {
    findOne: jest.fn(),
  } as unknown as Repository<Role>;

  const mailService = {
    send: jest.fn(),
  } as unknown as MailService;

  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      if (key === 'security.bcryptSaltRounds') return 12;
      return defaultValue;
    }),
  } as unknown as ConfigService;

  const hashMock = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      userRepository,
      roleRepository,
      mailService,
      configService,
    );
  });

  it('finds user by id with role relation', async () => {
    const user = { id: 'user-1', email: 'john@example.com' };
    (userRepository.findOne as jest.Mock).mockResolvedValue(user);

    await expect(service.findById('user-1')).resolves.toEqual(user);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      relations: ['roles', 'roles.permissions'],
    });
  });

  it('returns null when user id does not exist', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.findById('ghost-id')).resolves.toBeNull();
  });

  it('finds user by email with role relation', async () => {
    const user = { id: 'user-1' };
    (userRepository.findOne as jest.Mock).mockResolvedValue(user);

    await expect(service.findByEmail('john@example.com')).resolves.toEqual(
      user,
    );
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'john@example.com' },
      relations: ['roles', 'roles.permissions'],
    });
  });

  it('creates users with hashed passwords and default role', async () => {
    const role = { id: 'role-1', name: 'user' };
    const createdEntity = { id: 'user-1' };
    const savedEntity = { id: 'user-1', email: 'john@example.com' };

    (roleRepository.findOne as jest.Mock).mockResolvedValue(role);
    hashMock.mockResolvedValue('hashed-password' as never);
    (userRepository.create as jest.Mock).mockReturnValue(createdEntity);
    (userRepository.save as jest.Mock).mockResolvedValue(savedEntity);
    (mailService.send as jest.Mock).mockResolvedValue(undefined);

    await expect(
      service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        language: 'en',
      }),
    ).resolves.toEqual(savedEntity);

    expect(roleRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'user' },
    });
    expect(hashMock).toHaveBeenCalledWith('password123', 12);
    expect(userRepository.create).toHaveBeenCalledWith({
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      roles: [role],
      status: 'active',
      language: 'en',
    });
    expect(userRepository.save).toHaveBeenCalledWith(createdEntity);

    expect(mailService.send).toHaveBeenCalledWith({
      to: 'john@example.com',
      subjectKey: 'mail.welcome_subject',
      template: MailTemplate.WELCOME,
      context: { name: 'John Doe' },
      language: 'en',
    });
  });

  it('throws InternalServerErrorException when default user role is missing', async () => {
    (roleRepository.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      service.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        language: 'en',
      }),
    ).rejects.toThrow('Default user role is not configured');
  });

  it('returns paginated users list', async () => {
    const query: QueryDto = {
      page: 2,
      limit: 5,
      sortBy: 'createdAt',
      order: 'DESC',
    };

    (userRepository.findAndCount as jest.Mock).mockResolvedValue([
      [{ id: 'user-1' }, { id: 'user-2' }],
      12,
    ]);

    const result = await service.findAll(query);

    expect(userRepository.findAndCount).toHaveBeenCalledWith({
      skip: 5,
      take: 5,
      order: { createdAt: 'DESC' },
      relations: ['roles'],
    });
    expect(result).toEqual({
      items: [{ id: 'user-1' }, { id: 'user-2' }],
      meta: {
        page: 2,
        limit: 5,
        totalItems: 12,
        totalPages: 3,
      },
    });
  });
});
