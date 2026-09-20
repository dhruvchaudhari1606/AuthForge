export const PERMISSIONS = {
  // Users
  USERS_READ: 'users.read',
  USERS_UPDATE: 'users.update',

  // Sessions
  SESSIONS_READ: 'sessions.read',
  SESSIONS_REVOKE: 'sessions.revoke',

  // Roles
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',

  // Permissions
  PERMISSIONS_READ: 'permissions.read',
  PERMISSIONS_MANAGE: 'permissions.manage',

  // Audit
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface SystemPermissionDefinition {
  name: PermissionName;
  description: string;
}

export const DEFAULT_SYSTEM_PERMISSIONS: SystemPermissionDefinition[] = [
  { name: PERMISSIONS.USERS_READ, description: 'Read user information' },
  { name: PERMISSIONS.USERS_UPDATE, description: 'Update user information' },
  { name: PERMISSIONS.SESSIONS_READ, description: 'Read user sessions' },
  { name: PERMISSIONS.SESSIONS_REVOKE, description: 'Revoke active sessions' },
  { name: PERMISSIONS.ROLES_READ, description: 'Read roles' },
  {
    name: PERMISSIONS.ROLES_MANAGE,
    description: 'Create, update, or delete roles',
  },
  {
    name: PERMISSIONS.PERMISSIONS_READ,
    description: 'Read system permissions',
  },
  { name: PERMISSIONS.PERMISSIONS_MANAGE, description: 'Manage permissions' },
  { name: PERMISSIONS.AUDIT_READ, description: 'View security audit logs' },
];
