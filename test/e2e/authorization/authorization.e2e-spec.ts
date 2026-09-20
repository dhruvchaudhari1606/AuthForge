import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthorizationController } from '../../../src/modules/authorization/authorization.controller';
import { AuthorizationService } from '../../../src/modules/authorization/authorization.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../src/common/guards/roles.guard';
import { PermissionsGuard } from '../../../src/common/guards/permissions.guard';
import { createE2eApp } from '../setup/create-e2e-app';
import { ROLES } from '@common/constants/constants';

type RequestWithUser = {
  user?: { userId: string; email: string; role: string };
};

describe('Authorization & RBAC routes (e2e)', () => {
  let app: INestApplication;

  const authorizationServiceMock = {
    getRoles: jest.fn(),
    getRoleById: jest.fn(),
    createRole: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    getPermissions: jest.fn(),
    assignPermissionsToRole: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
    getUserPermissions: jest.fn(),
  };

  const jwtAuthGuardMock = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<RequestWithUser>();
      req.user = {
        userId: 'admin-1',
        email: 'admin@example.com',
        role: ROLES.ADMIN,
      };
      return true;
    }),
  };

  const permissionsGuardMock = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    app = await createE2eApp(
      Test.createTestingModule({
        controllers: [AuthorizationController],
        providers: [
          {
            provide: AuthorizationService,
            useValue: authorizationServiceMock,
          },
          RolesGuard,
          PermissionsGuard,
        ],
      })
        .overrideGuard(JwtAuthGuard)
        .useValue(jwtAuthGuardMock)
        .overrideGuard(PermissionsGuard)
        .useValue(permissionsGuardMock),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
    permissionsGuardMock.canActivate.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/roles', () => {
    it('returns roles list for authorized caller', async () => {
      authorizationServiceMock.getRoles.mockResolvedValue([
        { id: 'r1', name: 'admin', permissions: [] },
        { id: 'r2', name: 'user', permissions: [] },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/roles')
        .expect(200);

      expect(authorizationServiceMock.getRoles).toHaveBeenCalled();
      const rolesData = (
        response.body as { data: Array<{ id: string; name: string }> }
      ).data;
      expect(rolesData).toHaveLength(2);
    });

    it('returns 403 when user lacks required permissions', async () => {
      permissionsGuardMock.canActivate.mockReturnValue(false);

      const response = await request(app.getHttpServer())
        .get('/api/v1/roles')
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 403,
      });
    });
  });

  describe('POST /api/v1/roles', () => {
    it('creates a new custom role', async () => {
      authorizationServiceMock.createRole.mockResolvedValue({
        id: 'r3',
        name: 'editor',
        description: 'Editor role',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/roles')
        .send({ name: 'editor', description: 'Editor role' })
        .expect(201);

      expect(authorizationServiceMock.createRole).toHaveBeenCalledWith(
        'admin-1',
        { name: 'editor', description: 'Editor role' },
      );
      const roleData = (response.body as { data: { id: string; name: string } })
        .data;
      expect(roleData).toMatchObject({
        id: 'r3',
        name: 'editor',
      });
    });
  });

  describe('POST /api/v1/users/:id/roles', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174099';

    it('assigns role to user', async () => {
      authorizationServiceMock.assignRoleToUser.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/api/v1/users/${validUuid}/roles`)
        .send({ roleName: 'editor' })
        .expect(200);

      expect(authorizationServiceMock.assignRoleToUser).toHaveBeenCalledWith(
        'admin-1',
        validUuid,
        'editor',
      );
      const assignData = (response.body as { data: { message: string } }).data;
      expect(assignData).toMatchObject({
        message: "Role 'editor' assigned successfully",
      });
    });
  });

  describe('GET /api/v1/permissions', () => {
    it('returns all system permissions', async () => {
      authorizationServiceMock.getPermissions.mockResolvedValue([
        { id: 'p1', name: 'users.read' },
        { id: 'p2', name: 'roles.manage' },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/permissions')
        .expect(200);

      expect(authorizationServiceMock.getPermissions).toHaveBeenCalled();
      const permsData = (
        response.body as { data: Array<{ id: string; name: string }> }
      ).data;
      expect(permsData).toHaveLength(2);
    });
  });
});
