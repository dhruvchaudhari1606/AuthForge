import {
  User,
  Session,
  Role,
  Permission,
  UserRole,
  RolePermission,
  PasswordReset,
  EmailVerification,
  AuditLog,
} from './index';
import { UserStatus, AuditEvent } from '@common/constants/constants';

describe('Database Entities', () => {
  it('creates a User entity instance with default values', () => {
    const user = new User();
    user.id = '123e4567-e89b-12d3-a456-426614174000';
    user.email = 'user@example.com';
    user.name = 'Test User';
    user.password = 'hashed-pw';
    user.status = UserStatus.ACTIVE;
    user.language = 'en';

    expect(user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(user.email).toBe('user@example.com');
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it('creates a Session entity instance with session metadata', () => {
    const session = new Session();
    session.id = 'session-id-123';
    session.user_id = 'user-id-123';
    session.refresh_token_hash = 'sha256-hash';
    session.browser = 'Chrome';
    session.os = 'Windows';
    session.ip_address = '127.0.0.1';
    session.expires_at = new Date();
    session.revoked_at = null;

    expect(session.id).toBe('session-id-123');
    expect(session.user_id).toBe('user-id-123');
    expect(session.revoked_at).toBeNull();
  });

  it('creates Role and Permission entities and establishes relationships', () => {
    const role = new Role();
    role.id = 'role-id-1';
    role.name = 'admin';
    role.description = 'Administrator role';

    const permission = new Permission();
    permission.id = 'perm-id-1';
    permission.name = 'users.read';
    permission.description = 'Read users';

    role.permissions = [permission];

    expect(role.name).toBe('admin');
    expect(role.permissions).toHaveLength(1);
    expect(role.permissions[0].name).toBe('users.read');
  });

  it('creates UserRole and RolePermission join entities', () => {
    const userRole = new UserRole();
    userRole.user_id = 'uid-1';
    userRole.role_id = 'rid-1';

    const rolePerm = new RolePermission();
    rolePerm.role_id = 'rid-1';
    rolePerm.permission_id = 'pid-1';

    expect(userRole.user_id).toBe('uid-1');
    expect(rolePerm.permission_id).toBe('pid-1');
  });

  it('creates PasswordReset and EmailVerification entities', () => {
    const pwReset = new PasswordReset();
    pwReset.user_id = 'uid-1';
    pwReset.token_hash = 'reset-token-hash';
    pwReset.expires_at = new Date();
    pwReset.used = false;

    const emailVerify = new EmailVerification();
    emailVerify.user_id = 'uid-1';
    emailVerify.token_hash = 'verify-token-hash';
    emailVerify.expires_at = new Date();

    expect(pwReset.used).toBe(false);
    expect(emailVerify.token_hash).toBe('verify-token-hash');
  });

  it('creates AuditLog entity with AuditEvent', () => {
    const audit = new AuditLog();
    audit.user_id = 'uid-1';
    audit.event = AuditEvent.AUTH_LOGIN_SUCCESS;
    audit.ip_address = '192.168.1.1';
    audit.metadata = { method: 'password' };

    expect(audit.event).toBe(AuditEvent.AUTH_LOGIN_SUCCESS);
    expect(audit.metadata).toEqual({ method: 'password' });
  });
});
