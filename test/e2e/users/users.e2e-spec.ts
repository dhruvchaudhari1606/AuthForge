import { ROLES } from '../../../src/common/constants/constants';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { UsersController } from '../../../src/modules/users/users.controller';
import { UsersService } from '../../../src/modules/users/users.service';
import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createE2eApp } from '../setup/create-e2e-app';

type RequestWithAuthUser = {
  user?: {
    userId: string;
    email: string;
    role: ROLES;
  };
};

describe('Users routes (e2e)', () => {
  let app: INestApplication;

  const usersServiceMock = {
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    updateProfileImage: jest.fn(),
  };

  const attachAdminUser = (context: ExecutionContext): boolean => {
    const req = context.switchToHttp().getRequest<RequestWithAuthUser>();
    req.user = {
      userId: 'admin-1',
      email: 'admin@example.com',
      role: ROLES.ADMIN,
    };

    return true;
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn(attachAdminUser),
  };

  const rolesGuardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        controllers: [UsersController],
        providers: [
          {
            provide: UsersService,
            useValue: usersServiceMock,
          },
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(jwtAuthGuardMock)
        .overrideGuard(RolesGuard)
        .useValue(rolesGuardMock),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();

    jwtAuthGuardMock.canActivate.mockImplementation(attachAdminUser);

    rolesGuardMock.canActivate.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/users returns paginated users', async () => {
    usersServiceMock.findAll.mockResolvedValue({
      items: [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users?page=1&limit=10&sortBy=createdAt&order=DESC')
      .expect(200);

    expect(usersServiceMock.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        order: 'DESC',
      }),
    );

    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        items: [
          {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });
  });

  it('GET /api/v1/users validates pagination query params', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users?page=0')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
      path: '/api/v1/users?page=0',
      message: expect.arrayContaining(['page must be a positive number']),
    });
  });

  it('GET /api/v1/users/profile returns authenticated profile', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .expect(200);

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
      'admin@example.com',
    );
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.com',
      },
    });
  });

  it('GET /api/v1/users is forbidden when role guard fails', async () => {
    rolesGuardMock.canActivate.mockReturnValueOnce(false);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 403,
      message: 'Forbidden resource',
      path: '/api/v1/users',
    });
  });

  it('GET /api/v1/users returns 401 when JWT guard rejects the request', async () => {
    jwtAuthGuardMock.canActivate.mockImplementationOnce(() => {
      throw new UnauthorizedException();
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
    });
  });

  it('GET /api/v1/users/profile returns null data when profile is not found', async () => {
    usersServiceMock.findByEmail.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/profile')
      .expect(200);

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
      'admin@example.com',
    );
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: null,
    });
  });

  it('GET /api/v1/users/me returns authenticated profile', async () => {
    usersServiceMock.findByEmail.mockResolvedValue({
      id: 'admin-1',
      name: 'Admin',
      email: 'admin@example.com',
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .expect(200);

    expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
      'admin@example.com',
    );
    expect(response.body).toEqual({
      success: true,
      message: 'Request successful',
      data: {
        id: 'admin-1',
        name: 'Admin',
        email: 'admin@example.com',
      },
    });
  });
});
